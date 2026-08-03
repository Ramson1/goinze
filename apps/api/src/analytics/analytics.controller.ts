import { Controller, Get, UseGuards } from '@nestjs/common';
import type { SessionUser } from '@goinze/shared-types';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SCHOOL_ADMIN', 'ACCOUNTANT')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: SessionUser) {
    return this.analyticsService.dashboard(user.schoolId);
  }

  @Get('admissions-trend')
  admissionsTrend(@CurrentUser() user: SessionUser) {
    return this.analyticsService.admissionsTrend(user.schoolId);
  }

  @Get('revenue')
  revenue(@CurrentUser() user: SessionUser) {
    return this.analyticsService.revenueBreakdown(user.schoolId);
  }

  @Get('revenue-by-month')
  revenueByMonth(@CurrentUser() user: SessionUser) {
    return this.analyticsService.revenueByMonth(user.schoolId);
  }

  @Get('admissions-by-month')
  admissionsByMonth(@CurrentUser() user: SessionUser) {
    return this.analyticsService.admissionsByMonth(user.schoolId);
  }

  @Get('enrollment-by-department')
  enrollmentByDepartment(@CurrentUser() user: SessionUser) {
    return this.analyticsService.enrollmentByDepartment(user.schoolId);
  }

  @Get('gender-distribution')
  genderDistribution(@CurrentUser() user: SessionUser) {
    return this.analyticsService.genderDistribution(user.schoolId);
  }

  @Get('payment-methods')
  paymentMethods(@CurrentUser() user: SessionUser) {
    return this.analyticsService.paymentMethods(user.schoolId);
  }
}
