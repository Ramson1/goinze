/**
 * Goinzeschool — database seed
 * Creates baseline permissions, a demo school, super admin, and sample academic data.
 * Run with: pnpm db:seed
 */
import { PrismaClient, UserRole, UserStatus, StudentStatus, SubscriptionPlan } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// The API verifies passwords with bcrypt, so seeded accounts must use bcrypt hashes
// (the previous sha256 placeholder hashes could not log in).
function hashPassword(pw: string): string {
  return bcrypt.hashSync(pw, 10);
}

const SCHOOL_NAME =
  'Goinze International School of Medical Health Science and Technology';

// Academic session runs July–June, so from July onwards it is `year/year+1`.
function currentAcademicSession(date = new Date()): string {
  const year = date.getFullYear();
  return date.getMonth() >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

const PERMISSIONS = [
  'student.create', 'student.read', 'student.update', 'student.delete',
  'staff.manage', 'admission.review', 'admission.approve',
  'finance.manage', 'payment.read', 'result.enter', 'result.approve',
  'cbt.manage', 'exam.take', 'report.view', 'settings.manage', 'system.admin',
];

async function main() {
  console.log('Seeding permissions...');
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: key },
    });
  }

  console.log('Seeding school...');
  const school = await prisma.school.upsert({
    where: { slug: 'goinze-demo' },
    update: {
      name: SCHOOL_NAME,
      email: 'gonzenicmhst@gmail.com',
      phone: '+2348105576617',
      primaryColor: '#1e40af',
    },
    create: {
      name: SCHOOL_NAME,
      slug: 'goinze-demo',
      code: 'GDU',
      email: 'gonzenicmhst@gmail.com',
      phone: '+2348105576617',
      primaryColor: '#1e40af',
      subscription: {
        create: { plan: SubscriptionPlan.ENTERPRISE, seats: 5000 },
      },
    },
  });

  console.log('Seeding super admin + school admin...');
  await prisma.user.upsert({
    where: { email: 'superadmin@goinzeschool.com' },
    update: {},
    create: {
      email: 'superadmin@goinzeschool.com',
      passwordHash: hashPassword('ChangeMe123!'),
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@goinze-demo.com' },
    update: {},
    create: {
      schoolId: school.id,
      email: 'admin@goinze-demo.com',
      passwordHash: hashPassword('ChangeMe123!'),
      firstName: 'School',
      lastName: 'Administrator',
      role: UserRole.SCHOOL_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  console.log('Seeding academic structure...');
  // The current session is derived from today's date (July–June cycle).
  const sessionName = currentAcademicSession();
  await prisma.academicSession.updateMany({
    where: { schoolId: school.id },
    data: { isCurrent: false },
  });
  const session = await prisma.academicSession.upsert({
    where: { schoolId_name: { schoolId: school.id, name: sessionName } },
    update: { isCurrent: true },
    create: { schoolId: school.id, name: sessionName, isCurrent: true },
  });

  // Real academic structure from the student handbook.
  const healthFaculty = await prisma.faculty.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'MHST' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Medical Health Science and Technology',
      code: 'MHST',
    },
  });

  const DEPARTMENTS: Array<{ code: string; name: string }> = [
    { code: 'CHEW', name: 'Community Health' },
    { code: 'MLT', name: 'Medical Laboratory Technician' },
    { code: 'PH', name: 'Public Health' },
    { code: 'PT', name: 'Pharmacy Technician' },
  ];

  const deptIds = new Map<string, string>();
  for (const d of DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { schoolId_code: { schoolId: school.id, code: d.code } },
      update: { name: d.name, facultyId: healthFaculty.id },
      create: {
        schoolId: school.id,
        facultyId: healthFaculty.id,
        name: d.name,
        code: d.code,
      },
    });
    deptIds.set(d.code, record.id);
  }

  const PROGRAMMES: Array<{
    dept: string;
    code: string;
    name: string;
    degreeType: string;
    durationYears: number;
  }> = [
    { dept: 'CHEW', code: 'ND-CHEW', name: 'National Diploma in Community Health (CHEW)', degreeType: 'ND', durationYears: 3 },
    { dept: 'MLT', code: 'ND-MLT', name: 'National Diploma in Medical Lab Technician (MLT)', degreeType: 'ND', durationYears: 3 },
    { dept: 'PH', code: 'ND-PH', name: 'National Diploma in Public Health (PH)', degreeType: 'ND', durationYears: 3 },
    { dept: 'PT', code: 'ND-PT', name: 'National Diploma in Pharmacy Technician (PT)', degreeType: 'ND', durationYears: 3 },
  ];

  console.log(`Seeding ${PROGRAMMES.length} programmes...`);
  for (const p of PROGRAMMES) {
    await prisma.programme.upsert({
      where: { schoolId_code: { schoolId: school.id, code: p.code } },
      update: { name: p.name },
      create: {
        schoolId: school.id,
        departmentId: deptIds.get(p.dept)!,
        name: p.name,
        code: p.code,
        degreeType: p.degreeType,
        durationYears: p.durationYears,
      },
    });
  }

  // Legacy demo structure kept so existing demo accounts/courses keep working.
  const faculty = await prisma.faculty.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'SCI' } },
    update: {},
    create: { schoolId: school.id, name: 'Faculty of Science', code: 'SCI' },
  });

  const dept = await prisma.department.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'CSC' } },
    update: {},
    create: {
      schoolId: school.id,
      facultyId: faculty.id,
      name: 'Computer Science',
      code: 'CSC',
    },
  });

  await prisma.programme.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'BSC-CSC' } },
    update: {},
    create: {
      schoolId: school.id,
      departmentId: dept.id,
      name: 'B.Sc Computer Science',
      code: 'BSC-CSC',
      degreeType: 'B.Sc',
      durationYears: 4,
    },
  });

  // 100-level course set for the CSC department (First + Second semester).
  // Totals are within the 15–24 unit registration window so a fresh student can register.
  const COURSES: Array<{
    code: string;
    title: string;
    creditUnits: number;
    semester: 'FIRST' | 'SECOND';
  }> = [
    // First semester
    { code: 'CSC101', title: 'Introduction to Computer Science', creditUnits: 3, semester: 'FIRST' },
    { code: 'CSC103', title: 'Introduction to Problem Solving', creditUnits: 3, semester: 'FIRST' },
    { code: 'MTH101', title: 'Elementary Mathematics I (Algebra & Trigonometry)', creditUnits: 3, semester: 'FIRST' },
    { code: 'MTH103', title: 'Elementary Mathematics III (Calculus)', creditUnits: 3, semester: 'FIRST' },
    { code: 'PHY101', title: 'General Physics I (Mechanics)', creditUnits: 3, semester: 'FIRST' },
    { code: 'BIO101', title: 'General Biology I', creditUnits: 3, semester: 'FIRST' },
    { code: 'GST101', title: 'Communication in English I', creditUnits: 2, semester: 'FIRST' },
    { code: 'GST103', title: 'Nigerian Peoples and Culture', creditUnits: 2, semester: 'FIRST' },
    // Second semester
    { code: 'CSC102', title: 'Introduction to Programming', creditUnits: 3, semester: 'SECOND' },
    { code: 'CSC104', title: 'Discrete Structures', creditUnits: 3, semester: 'SECOND' },
    { code: 'MTH102', title: 'Elementary Mathematics II (Calculus)', creditUnits: 3, semester: 'SECOND' },
    { code: 'PHY102', title: 'General Physics II (Electricity & Magnetism)', creditUnits: 3, semester: 'SECOND' },
    { code: 'BIO102', title: 'General Biology II', creditUnits: 3, semester: 'SECOND' },
    { code: 'GST102', title: 'Communication in English II', creditUnits: 2, semester: 'SECOND' },
    { code: 'GST104', title: 'Nigerian Economy and Culture', creditUnits: 2, semester: 'SECOND' },
  ];

  console.log(`Seeding ${COURSES.length} courses...`);
  const courseRecords: Array<{ id: string; code: string }> = [];
  for (const c of COURSES) {
    const course = await prisma.course.upsert({
      where: { schoolId_code: { schoolId: school.id, code: c.code } },
      update: {},
      create: {
        schoolId: school.id,
        departmentId: dept.id,
        code: c.code,
        title: c.title,
        creditUnits: c.creditUnits,
        level: 100,
        semester: c.semester,
      },
    });
    courseRecords.push({ id: course.id, code: course.code });
  }

  // A demo lecturer (Staff + User) allocated to every 100-level CSC course, so the
  // lecturer portal has courses to teach, rosters to score, and results to publish.
  console.log('Seeding demo lecturer...');
  const lecturerUser = await prisma.user.upsert({
    where: { email: 'lecturer@csc.goinze-demo.com' },
    update: {},
    create: {
      schoolId: school.id,
      email: 'lecturer@csc.goinze-demo.com',
      passwordHash: hashPassword('Lecturer123!'),
      firstName: 'Jane',
      lastName: 'Adebayo',
      role: UserRole.LECTURER,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  const lecturer = await prisma.staff.upsert({
    where: { staffNumber: 'GDU-STAFF-0001' },
    update: { userId: lecturerUser.id },
    create: {
      schoolId: school.id,
      userId: lecturerUser.id,
      staffNumber: 'GDU-STAFF-0001',
      firstName: 'Jane',
      lastName: 'Adebayo',
      title: 'Dr.',
      email: 'lecturer@csc.goinze-demo.com',
      departmentId: dept.id,
      designation: 'Lecturer I',
      qualification: 'Ph.D Computer Science',
      isLecturer: true,
    },
  });

  for (const c of courseRecords) {
    await prisma.courseAllocation.upsert({
      where: {
        courseId_staffId_sessionId: {
          courseId: c.id,
          staffId: lecturer.id,
          sessionId: session.id,
        },
      },
      update: {},
      create: { courseId: c.id, staffId: lecturer.id, sessionId: session.id },
    });
  }

  // Personal accounts requested by the school owner.
  console.log('Seeding personal accounts...');
  await prisma.user.upsert({
    where: { email: 'blackboxinfo01@gmail.com' },
    update: { passwordHash: hashPassword('111111Ss.') },
    create: {
      schoolId: school.id,
      email: 'blackboxinfo01@gmail.com',
      passwordHash: hashPassword('111111Ss.'),
      firstName: 'Black',
      lastName: 'Box',
      role: UserRole.SCHOOL_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  const ownerLecturerUser = await prisma.user.upsert({
    where: { email: 'lnexstudentapp@gmail.com' },
    update: { passwordHash: hashPassword('111111Ss.') },
    create: {
      schoolId: school.id,
      email: 'lnexstudentapp@gmail.com',
      passwordHash: hashPassword('111111Ss.'),
      firstName: 'Lnex',
      lastName: 'Lecturer',
      role: UserRole.LECTURER,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  const ownerLecturer = await prisma.staff.upsert({
    where: { staffNumber: 'GDU-STAFF-0002' },
    update: { userId: ownerLecturerUser.id },
    create: {
      schoolId: school.id,
      userId: ownerLecturerUser.id,
      staffNumber: 'GDU-STAFF-0002',
      firstName: 'Lnex',
      lastName: 'Lecturer',
      title: 'Mr.',
      email: 'lnexstudentapp@gmail.com',
      departmentId: dept.id,
      designation: 'Lecturer II',
      qualification: 'M.Sc Computer Science',
      isLecturer: true,
    },
  });

  // Allocate the CSC course set so the lecturer portal has content.
  for (const c of courseRecords) {
    await prisma.courseAllocation.upsert({
      where: {
        courseId_staffId_sessionId: {
          courseId: c.id,
          staffId: ownerLecturer.id,
          sessionId: session.id,
        },
      },
      update: {},
      create: { courseId: c.id, staffId: ownerLecturer.id, sessionId: session.id },
    });
  }

  const ownerStudentUser = await prisma.user.upsert({
    where: { email: 'onyevid@gmail.com' },
    update: { passwordHash: hashPassword('111111Ss.') },
    create: {
      schoolId: school.id,
      email: 'onyevid@gmail.com',
      passwordHash: hashPassword('111111Ss.'),
      firstName: 'Onye',
      lastName: 'David',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  });

  const csProgramme = await prisma.programme.findUnique({
    where: { schoolId_code: { schoolId: school.id, code: 'BSC-CSC' } },
  });
  await prisma.student.upsert({
    where: { matricNumber: `GDU/CSC/${new Date().getFullYear()}/0001` },
    update: { userId: ownerStudentUser.id },
    create: {
      schoolId: school.id,
      userId: ownerStudentUser.id,
      matricNumber: `GDU/CSC/${new Date().getFullYear()}/0001`,
      firstName: 'Onye',
      lastName: 'David',
      email: 'onyevid@gmail.com',
      status: StudentStatus.ACTIVE,
      programmeId: csProgramme?.id,
      departmentId: dept.id,
      currentLevel: 100,
      entrySessionId: session.id,
    },
  });

  console.log('Seed complete.');
  console.log('  Super admin: superadmin@goinzeschool.com / ChangeMe123!');
  console.log('  School admin: admin@goinze-demo.com / ChangeMe123!');
  console.log('  Lecturer:    lecturer@csc.goinze-demo.com / Lecturer123!');
  console.log('  Owner admin:    blackboxinfo01@gmail.com / 111111Ss.');
  console.log('  Owner lecturer: lnexstudentapp@gmail.com / 111111Ss.');
  console.log('  Owner student:  onyevid@gmail.com / 111111Ss.');
  console.log(`  Session: ${session.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
