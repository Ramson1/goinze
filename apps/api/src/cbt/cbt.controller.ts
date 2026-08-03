import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { SessionUser } from '@goinze/shared-types';
import { CbtService } from './cbt.service';
import {
  CreateQuestionBankDto,
  CreateQuestionDto,
  CreateExamDto,
  AddExamQuestionsDto,
  StartAttemptDto,
  SubmitAttemptDto,
  UpdateExamStatusDto,
} from './dto/cbt.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('cbt')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CbtController {
  constructor(private readonly cbtService: CbtService) {}

  // ---- Question banks ----
  @Get('question-banks')
  @Roles('SCHOOL_ADMIN', 'LECTURER')
  listBanks(@CurrentUser() user: SessionUser) {
    return this.cbtService.listBanks(user.schoolId);
  }

  @Post('question-banks')
  @Roles('SCHOOL_ADMIN', 'LECTURER')
  createBank(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateQuestionBankDto,
  ) {
    return this.cbtService.createBank(user.schoolId, dto);
  }

  // ---- Questions ----
  @Get('question-banks/:bankId/questions')
  @Roles('SCHOOL_ADMIN', 'LECTURER')
  listQuestions(@Param('bankId') bankId: string) {
    return this.cbtService.listQuestions(bankId);
  }

  @Post('questions')
  @Roles('SCHOOL_ADMIN', 'LECTURER')
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.cbtService.createQuestion(dto);
  }

  // ---- Exams ----
  @Get('exams')
  @Roles('SCHOOL_ADMIN', 'LECTURER', 'STUDENT')
  listExams(@CurrentUser() user: SessionUser) {
    return this.cbtService.listExams(user.schoolId);
  }

  @Get('exams/:id')
  @Roles('SCHOOL_ADMIN', 'LECTURER', 'STUDENT')
  getExam(@Param('id') id: string) {
    return this.cbtService.getExam(id);
  }

  @Post('exams')
  @Roles('SCHOOL_ADMIN', 'LECTURER')
  createExam(@CurrentUser() user: SessionUser, @Body() dto: CreateExamDto) {
    return this.cbtService.createExam(user.schoolId, dto);
  }

  @Post('exams/:id/questions')
  @Roles('SCHOOL_ADMIN', 'LECTURER')
  addExamQuestions(
    @Param('id') id: string,
    @Body() dto: AddExamQuestionsDto,
  ) {
    return this.cbtService.addExamQuestions(id, dto);
  }

  @Patch('exams/:id/status')
  @Roles('SCHOOL_ADMIN', 'LECTURER')
  updateExamStatus(
    @Param('id') id: string,
    @Body() dto: UpdateExamStatusDto,
  ) {
    return this.cbtService.updateExamStatus(id, dto);
  }

  @Get('exams/:id/attempts')
  @Roles('SCHOOL_ADMIN', 'LECTURER')
  listAttempts(@Param('id') id: string) {
    return this.cbtService.listAttempts(id);
  }

  // ---- Attempts ----
  @Post('attempts/start')
  @Roles('STUDENT', 'SCHOOL_ADMIN')
  startAttempt(@Body() dto: StartAttemptDto) {
    return this.cbtService.startAttempt(dto);
  }

  @Post('attempts/:id/submit')
  @Roles('STUDENT', 'SCHOOL_ADMIN')
  submitAttempt(
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.cbtService.submitAttempt(id, dto);
  }
}
