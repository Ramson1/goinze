import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Analytics: dashboard metrics — counts, revenue sum and admissions trend.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private where(schoolId: string | null) {
    return schoolId ? { schoolId } : {};
  }

  /** Top-line counts and revenue for the dashboard. */
  async dashboard(schoolId: string | null) {
    const [
      students,
      staff,
      applications,
      activeExams,
      revenue,
      pendingPayments,
    ] = await Promise.all([
      this.prisma.db.student.count({ where: this.where(schoolId) }),
      this.prisma.db.staff.count({ where: this.where(schoolId) }),
      this.prisma.db.application.count({ where: this.where(schoolId) }),
      this.prisma.db.exam.count({
        where: { ...this.where(schoolId), status: 'ACTIVE' },
      }),
      this.prisma.db.payment.aggregate({
        where: { ...this.where(schoolId), status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.prisma.db.payment.count({
        where: { ...this.where(schoolId), status: 'PENDING' },
      }),
    ]);

    return {
      counts: { students, staff, applications, activeExams, pendingPayments },
      revenue: Number(revenue._sum.amount ?? 0),
    };
  }

  /** Admissions trend: applications grouped by status (lightweight proxy). */
  async admissionsTrend(schoolId: string | null) {
    const byStatus = await this.prisma.db.application.groupBy({
      by: ['status'],
      where: this.where(schoolId),
      _count: { _all: true },
    });
    return byStatus.map((r) => ({ status: r.status, count: r._count._all }));
  }

  /** Revenue broken down by payment status. */
  async revenueBreakdown(schoolId: string | null) {
    const byStatus = await this.prisma.db.payment.groupBy({
      by: ['status'],
      where: this.where(schoolId),
      _sum: { amount: true },
      _count: { _all: true },
    });
    return byStatus.map((r) => ({
      status: r.status,
      count: r._count._all,
      amount: Number(r._sum.amount ?? 0),
    }));
  }

  /** Build the last `n` month buckets (oldest first) with stable keys. */
  private monthBuckets(n: number) {
    const now = new Date();
    const buckets: Array<{ key: string; label: string }> = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString('en', { month: 'short' }),
      });
    }
    return buckets;
  }

  private bucketKey(date: Date | null | undefined): string {
    const d = date ? new Date(date) : new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
  }

  /** Monthly collected revenue for the last 12 months (SUCCESS payments). */
  async revenueByMonth(schoolId: string | null) {
    const buckets = this.monthBuckets(12);
    const totals = new Map(buckets.map((b) => [b.key, 0]));

    const payments = await this.prisma.db.payment.findMany({
      where: { ...this.where(schoolId), status: 'SUCCESS' },
      select: { amount: true, paidAt: true, createdAt: true },
    });
    for (const p of payments) {
      const key = this.bucketKey(p.paidAt ?? p.createdAt);
      if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + Number(p.amount));
    }

    return buckets.map((b) => ({ month: b.label, revenue: totals.get(b.key) ?? 0 }));
  }

  /** Monthly applications vs admits for the last 12 months. */
  async admissionsByMonth(schoolId: string | null) {
    const buckets = this.monthBuckets(12);
    const apps = new Map(buckets.map((b) => [b.key, 0]));
    const admitted = new Map(buckets.map((b) => [b.key, 0]));

    const applications = await this.prisma.db.application.findMany({
      where: this.where(schoolId),
      select: { createdAt: true, status: true },
    });
    for (const a of applications) {
      const key = this.bucketKey(a.createdAt);
      if (apps.has(key)) {
        apps.set(key, (apps.get(key) ?? 0) + 1);
        if (a.status === 'ADMITTED') admitted.set(key, (admitted.get(key) ?? 0) + 1);
      }
    }

    return buckets.map((b) => ({
      month: b.label,
      applications: apps.get(b.key) ?? 0,
      admitted: admitted.get(b.key) ?? 0,
    }));
  }

  /** Students grouped by department (name + count). */
  async enrollmentByDepartment(schoolId: string | null) {
    const rows = await this.prisma.db.student.groupBy({
      by: ['departmentId'],
      where: this.where(schoolId),
      _count: { _all: true },
    });
    const deptIds = rows.map((r) => r.departmentId).filter((id): id is string => Boolean(id));
    const depts = await this.prisma.db.department.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(depts.map((d) => [d.id, d.name]));
    return rows.map((r) => ({
      name: r.departmentId ? nameMap.get(r.departmentId) ?? 'Unknown' : 'Unassigned',
      value: r._count._all,
    }));
  }

  /** Students grouped by gender. */
  async genderDistribution(schoolId: string | null) {
    const rows = await this.prisma.db.student.groupBy({
      by: ['gender'],
      where: this.where(schoolId),
      _count: { _all: true },
    });
    return rows.map((r) => ({ name: r.gender ?? 'UNKNOWN', value: r._count._all }));
  }

  /** Payments grouped by gateway (count). */
  async paymentMethods(schoolId: string | null) {
    const rows = await this.prisma.db.payment.groupBy({
      by: ['gateway'],
      where: this.where(schoolId),
      _count: { _all: true },
    });
    return rows.map((r) => ({ name: r.gateway, value: r._count._all }));
  }
}
