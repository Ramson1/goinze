import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { SessionUser } from '@goinze/shared-types';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SCHOOL_ADMIN')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getAll(@CurrentUser() user: SessionUser) {
    return this.settingsService.getAll(user.schoolId);
  }

  @Put()
  updateMany(
    @CurrentUser() user: SessionUser,
    @Body() entries: Record<string, any>,
  ) {
    return this.settingsService.updateMany(user.schoolId, entries);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: SessionUser) {
    return this.settingsService.getProfile(user.schoolId);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: SessionUser,
    @Body() data: Record<string, any>,
  ) {
    return this.settingsService.updateProfile(user.schoolId, data);
  }

  @Patch(':key')
  upsert(
    @CurrentUser() user: SessionUser,
    @Param('key') key: string,
    @Body() body: { value: any },
  ) {
    return this.settingsService.upsert(user.schoolId, key, body.value);
  }
}
