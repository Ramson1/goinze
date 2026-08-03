import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { AuthTokens, JwtPayload, SessionUser } from '@goinze/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly security: SecurityService,
  ) {}

  /** Register a new user account and issue tokens. */
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const exists = await this.prisma.db.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.db.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        schoolId: dto.schoolId,
        role: (dto.role as any) ?? 'STUDENT',
        status: 'ACTIVE',
      },
    });

    return this.issueTokens(user);
  }

  /** Validate credentials and issue tokens. */
  async login(dto: LoginDto): Promise<AuthTokens> {
    let user: Awaited<ReturnType<AuthService['validateUser']>>;
    try {
      user = await this.validateUser(dto.email, dto.password);
    } catch (err) {
      await this.security
        .log({
          action: 'auth.login_failed',
          entity: 'User',
          metadata: { email: dto.email.toLowerCase() },
        })
        .catch(() => undefined);
      throw err;
    }
    await this.prisma.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.prisma.db.loginHistory.create({
      data: { userId: user.id, success: true },
    });
    await this.security
      .log({
        schoolId: user.schoolId,
        userId: user.id,
        action: 'auth.login',
        entity: 'User',
        entityId: user.id,
        metadata: { email: user.email },
      })
      .catch(() => undefined);
    return this.issueTokens(user);
  }

  /** Verify an email/password pair and return the user (sans password hash). */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  /** Rotate tokens given a valid refresh token. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>(
          'JWT_REFRESH_SECRET',
          'change-me-refresh-secret',
        ),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.db.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return this.issueTokens(user);
  }

  /** Logout is stateless for JWTs; the client discards the tokens. */
  async logout(): Promise<{ success: true }> {
    return { success: true };
  }

  /** Return the current user's profile (without the password hash). */
  async me(userId: string): Promise<SessionUser> {
    const user = await this.prisma.db.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as SessionUser['role'],
      schoolId: user.schoolId,
      avatarUrl: user.avatarUrl,
    };
  }

  /** Change the current user's password after verifying the existing one. */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const user = await this.prisma.db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new BadRequestException('Current password is incorrect');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await this.security
      .log({
        schoolId: user.schoolId,
        userId: user.id,
        action: 'auth.password_changed',
        entity: 'User',
        entityId: user.id,
      })
      .catch(() => undefined);
    return { success: true };
  }

  /** Sign an access + refresh JWT pair for a user. */
  private async issueTokens(user: {
    id: string;
    email: string;
    role: string;
    schoolId: string | null;
  }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
      schoolId: user.schoolId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET', 'change-me-access-secret'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
      }),
      this.jwt.signAsync(
        { sub: user.id },
        {
          secret: this.config.get<string>(
            'JWT_REFRESH_SECRET',
            'change-me-refresh-secret',
          ),
          expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '7d'),
        },
      ),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
