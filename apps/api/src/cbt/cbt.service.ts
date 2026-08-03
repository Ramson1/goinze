import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateQuestionBankDto,
  CreateQuestionDto,
  CreateExamDto,
  AddExamQuestionsDto,
  StartAttemptDto,
  SubmitAttemptDto,
  UpdateExamStatusDto,
} from './dto/cbt.dto';

/**
 * Computer-Based Testing: question banks, questions, exams, exam questions,
 * attempts and auto-grading of objective questions.
 */
@Injectable()
export class CbtService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Question banks ----
  listBanks(schoolId: string | null) {
    return this.prisma.db.questionBank.findMany({
      where: schoolId ? { schoolId } : {},
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createBank(schoolId: string | null, dto: CreateQuestionBankDto) {
    return this.prisma.db.questionBank.create({
      data: {
        schoolId: schoolId ?? '',
        title: dto.title,
        courseId: dto.courseId,
        category: dto.category,
      },
    });
  }

  // ---- Questions ----
  listQuestions(bankId: string) {
    return this.prisma.db.question.findMany({
      where: { bankId },
      include: { options: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  createQuestion(dto: CreateQuestionDto) {
    return this.prisma.db.question.create({
      data: {
        bankId: dto.bankId,
        type: (dto.type as any) ?? 'OBJECTIVE',
        text: dto.text,
        marks: dto.marks ?? 1,
        difficulty: dto.difficulty ?? 'medium',
        explanation: dto.explanation,
        options: dto.options?.length
          ? {
              create: dto.options.map((o, i) => ({
                text: o.text,
                isCorrect: o.isCorrect ?? false,
                order: o.order ?? i,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });
  }

  // ---- Exams ----
  listExams(schoolId: string | null) {
    return this.prisma.db.exam.findMany({
      where: schoolId ? { schoolId } : {},
      include: {
        course: true,
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExam(id: string) {
    const exam = await this.prisma.db.exam.findUnique({
      where: { id },
      include: {
        questions: { include: { question: { include: { options: true } } } },
        course: true,
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  createExam(schoolId: string | null, dto: CreateExamDto) {
    return this.prisma.db.exam.create({
      data: {
        schoolId: schoolId ?? '',
        title: dto.title,
        courseId: dto.courseId,
        sessionId: dto.sessionId,
        instructions: dto.instructions,
        durationMins: dto.durationMins ?? 60,
        passMark: dto.passMark ?? 40,
        shuffleQuestions: dto.shuffleQuestions ?? true,
        lockBrowser: dto.lockBrowser ?? false,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        status: 'DRAFT',
      },
    });
  }

  async updateExamStatus(id: string, dto: UpdateExamStatusDto) {
    const exam = await this.prisma.db.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');
    return this.prisma.db.exam.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  addExamQuestions(examId: string, dto: AddExamQuestionsDto) {
    return this.prisma.db.examQuestion.createMany({
      data: dto.questionIds.map((questionId, order) => ({
        examId,
        questionId,
        order,
      })),
      skipDuplicates: true,
    });
  }

  // ---- Attempts ----
  async startAttempt(dto: StartAttemptDto) {
    const exam = await this.prisma.db.exam.findUnique({
      where: { id: dto.examId },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const existing = await this.prisma.db.examAttempt.findUnique({
      where: {
        examId_studentId: { examId: dto.examId, studentId: dto.studentId },
      },
    });
    if (existing) return existing;

    return this.prisma.db.examAttempt.create({
      data: {
        examId: dto.examId,
        studentId: dto.studentId,
        status: 'IN_PROGRESS',
      },
    });
  }

  /**
   * Submit an attempt: persist responses and auto-grade objective questions
   * by comparing selected options against the correct ones.
   */
  async submitAttempt(attemptId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.db.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Attempt already submitted');
    }

    let totalScore = 0;

    for (const answer of dto.answers) {
      const question = await this.prisma.db.question.findUnique({
        where: { id: answer.questionId },
        include: { options: true },
      });
      if (!question) continue;

      const correctOptionIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort();
      const selected = [...(answer.selectedOptions ?? [])].sort();

      const isObjective =
        question.type === 'OBJECTIVE' || question.type === 'TRUE_FALSE';
      const isCorrect =
        isObjective &&
        correctOptionIds.length > 0 &&
        correctOptionIds.length === selected.length &&
        correctOptionIds.every((id, i) => id === selected[i]);

      const awardedMarks = isCorrect ? question.marks : 0;
      totalScore += awardedMarks;

      await this.prisma.db.answerResponse.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: answer.questionId,
          },
        },
        create: {
          attemptId,
          questionId: answer.questionId,
          selectedOptions: answer.selectedOptions ?? [],
          essayText: answer.essayText,
          isCorrect,
          awardedMarks,
        },
        update: {
          selectedOptions: answer.selectedOptions ?? [],
          essayText: answer.essayText,
          isCorrect,
          awardedMarks,
        },
      });
    }

    return this.prisma.db.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'GRADED',
        score: totalScore,
        submittedAt: new Date(),
      },
      include: { responses: true },
    });
  }

  listAttempts(examId: string) {
    return this.prisma.db.examAttempt.findMany({
      where: { examId },
      include: { student: true },
      orderBy: { startedAt: 'desc' },
    });
  }
}
