import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { SessionUser } from '@goinze/shared-types';
import { AdmissionsService } from './admissions.service';
import { ApplyDto, ReviewApplicationDto } from './dto/admission.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  /** Public application form submission. */
  @Public()
  @Post('apply')
  apply(@Body() dto: ApplyDto) {
    return this.admissionsService.apply(null, dto);
  }

  /** Public status lookup for applicants (applicationNo + email). */
  @Public()
  @Get('track')
  track(@Query('applicationNo') applicationNo: string, @Query('email') email: string) {
    return this.admissionsService.trackStatus(applicationNo, email);
  }

  @Get()
  @Roles('SCHOOL_ADMIN', 'ADMISSION_OFFICER')
  findAll(
    @CurrentUser() user: SessionUser,
    @Query() query: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.admissionsService.findAll(user.schoolId, query, status);
  }

  @Get(':id')
  @Roles('SCHOOL_ADMIN', 'ADMISSION_OFFICER')
  findOne(@Param('id') id: string) {
    return this.admissionsService.findOne(id);
  }

  @Patch(':id/review')
  @Roles('SCHOOL_ADMIN', 'ADMISSION_OFFICER')
  review(
    @Param('id') id: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.admissionsService.review(id, user.id, dto);
  }

  @Patch(':id/approve')
  @Roles('SCHOOL_ADMIN', 'ADMISSION_OFFICER')
  approve(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    return this.admissionsService.approve(id, user.id);
  }

  /** Finalize onboarding once the acceptance fee is paid. */
  @Patch(':id/admit')
  @Roles('SCHOOL_ADMIN', 'ADMISSION_OFFICER')
  admit(@Param('id') id: string) {
    return this.admissionsService.admit(id);
  }

  @Post(':id/letter')
  @Roles('SCHOOL_ADMIN', 'ADMISSION_OFFICER')
  generateLetter(@Param('id') id: string) {
    return this.admissionsService.generateLetter(id);
  }
}
