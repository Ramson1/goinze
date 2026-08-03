/**
 * Central sample/mock data for the Goinze International School of Medical Health Science and Technology public website.
 * Everything here is static demo content — no backend calls are made.
 */
import { currentAcademicSession } from "@goinze/shared-utils";

/* ---------------------------------- Types --------------------------------- */

export type NewsPost = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string; // ISO date (yyyy-mm-dd)
  author: string;
  image: string;
  content: string[];
};

export type Announcement = {
  id: number;
  title: string;
  date: string;
  tag: string;
};

export type EventItem = {
  id: number;
  title: string;
  description: string;
  date: string; // ISO date (yyyy-mm-dd)
  day: string;
  month: string;
  time: string;
  location: string;
};

export type GalleryPhoto = {
  id: number;
  album: string;
  src: string;
  caption: string;
};

export type VideoItem = {
  id: number;
  title: string;
  duration: string;
  thumbnail: string;
};

export type Testimonial = {
  id: number;
  name: string;
  role: string;
  quote: string;
  initials: string;
};

export type Stat = {
  label: string;
  value: string;
};

export type Programme = {
  name: string;
  level: string;
  duration: string;
};

export type Faculty = {
  id: number;
  name: string;
  icon: string;
  description: string;
  departments: string[];
  programmes: Programme[];
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  bio: string;
  initials: string;
};

export type StaffMember = {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  initials: string;
};

export type AlumniStory = {
  id: number;
  name: string;
  graduationYear: string;
  programme: string;
  currentRole: string;
  story: string;
  initials: string;
};

export type FeeRow = {
  programme: string;
  application: string;
  tuition: string;
  total: string;
};

/* ---------------------------------- News ---------------------------------- */

export const newsCategories = [
  "All",
  "Campus",
  "Research",
  "Academics",
  "Sports",
  "Community",
] as const;

export const newsPosts: NewsPost[] = [
  {
    slug: "goinze-opens-state-of-the-art-ai-research-lab",
    title: "Goinze Opens State-of-the-Art AI Research Lab",
    category: "Research",
    excerpt:
      "The new Artificial Intelligence Research Lab will host graduate researchers and industry partners working on applied machine learning.",
    date: "2026-06-18",
    author: "Dr. Amara Okafor",
    image: "https://picsum.photos/seed/goinze-ai-lab/900/560",
    content: [
      "Goinze International School of Medical Health Science and Technology has officially opened its new Artificial Intelligence Research Lab, a purpose-built facility designed to accelerate applied machine learning research across the faculties of Science, Engineering and Health.",
      "The lab is equipped with high-performance GPU clusters, a dedicated data annotation suite and collaborative research studios. It will host graduate researchers, postdoctoral fellows and industry partners working on projects ranging from medical imaging to climate modelling.",
      "\"Our goal is to make Goinze a regional hub for responsible AI,\" said Dr. Amara Okafor, Director of Research. \"This facility gives our students access to the same tools used by leading technology companies around the world.\"",
      "The university also announced a series of open research seminars that will begin next semester, inviting the public and partner institutions to engage with ongoing projects.",
    ],
  },
  {
    slug: "convocation-2026-celebrates-record-graduating-class",
    title: "Convocation 2026 Celebrates a Record Graduating Class",
    category: "Campus",
    excerpt:
      "Over 2,400 students received their degrees at this year's convocation ceremony, the largest graduating class in the university's history.",
    date: "2026-05-30",
    author: "Office of the Registrar",
    image: "https://picsum.photos/seed/goinze-convocation/900/560",
    content: [
      "Goinze International School of Medical Health Science and Technology celebrated its largest graduating class to date at Convocation 2026, conferring degrees on more than 2,400 students across six faculties.",
      "The ceremony, held at the main amphitheatre, was attended by students, families, faculty and distinguished guests. The keynote address was delivered by alumna and technology entrepreneur, Mrs. Linda Eze.",
      "Vice-Chancellor Prof. Chinedu Balogun congratulated the graduates, urging them to carry the university's values of excellence and integrity into their careers and communities.",
      "A total of 118 students graduated with first-class honours, and several research prizes were awarded for outstanding postgraduate work.",
    ],
  },
  {
    slug: "goinze-wins-national-engineering-innovation-award",
    title: "Goinze Wins National Engineering Innovation Award",
    category: "Academics",
    excerpt:
      "A student-led team from the Faculty of Engineering took first place at the National Innovation Challenge for their low-cost water purification system.",
    date: "2026-04-22",
    author: "Faculty of Engineering",
    image: "https://picsum.photos/seed/goinze-engineering/900/560",
    content: [
      "A student-led team from the Faculty of Engineering has won the National Innovation Challenge, taking first place for their low-cost, solar-powered water purification system.",
      "The winning prototype was developed over two semesters as part of the faculty's capstone design programme and has already been piloted in three rural communities.",
      "The team will represent the university at the international finals later this year and has received seed funding to refine the design for wider deployment.",
      "The award underscores the university's commitment to hands-on, problem-driven engineering education.",
    ],
  },
  {
    slug: "university-football-team-lifts-regional-championship",
    title: "University Football Team Lifts Regional Championship",
    category: "Sports",
    excerpt:
      "The Goinze Lions secured a dramatic 2-1 victory in the final to claim their third regional championship title in five years.",
    date: "2026-03-14",
    author: "Directorate of Sports",
    image: "https://picsum.photos/seed/goinze-football/900/560",
    content: [
      "The Goinze Lions football team have been crowned regional champions after a dramatic 2-1 victory in Saturday's final at the university stadium.",
      "A late winner in the 88th minute sealed the title — the programme's third championship in five years — and sent the home crowd into raptures.",
      "Head coach Mr. Samuel Adeyemi praised the squad's discipline and depth, crediting the university's sports science support team for a season with remarkably few injuries.",
      "The team will now prepare for the national collegiate tournament, where they are among the seeded sides.",
    ],
  },
  {
    slug: "new-partnership-expands-student-exchange-opportunities",
    title: "New Partnership Expands Student Exchange Opportunities",
    category: "Academics",
    excerpt:
      "A new agreement with three international universities will double the number of semester-abroad placements available to undergraduates.",
    date: "2026-02-09",
    author: "International Office",
    image: "https://picsum.photos/seed/goinze-exchange/900/560",
    content: [
      "Goinze International School of Medical Health Science and Technology has signed a landmark exchange agreement with three international partner universities, doubling the number of semester-abroad placements available to undergraduates.",
      "The agreement covers credit transfer, joint supervision of final-year projects and a new staff mobility scheme for teaching and research exchanges.",
      "Applications for the first cohort open next month, with priority given to students in their penultimate year of study.",
      "The International Office will host an information session to walk applicants through eligibility, funding and visa support.",
    ],
  },
  {
    slug: "students-lead-community-health-outreach-in-neighbouring-towns",
    title: "Students Lead Community Health Outreach in Neighbouring Towns",
    category: "Community",
    excerpt:
      "Volunteers from the Faculty of Health Sciences screened over 900 residents during a weekend health outreach programme.",
    date: "2026-01-25",
    author: "Faculty of Health Sciences",
    image: "https://picsum.photos/seed/goinze-outreach/900/560",
    content: [
      "More than 120 student volunteers from the Faculty of Health Sciences took part in a weekend community health outreach, screening over 900 residents across three neighbouring towns.",
      "The programme offered free blood pressure, blood sugar and vision screenings, alongside health education sessions on nutrition and hygiene.",
      "Students worked under the supervision of faculty clinicians, gaining valuable field experience while delivering a meaningful service to the community.",
      "The outreach is part of the university's broader community engagement strategy, which pairs academic learning with civic responsibility.",
    ],
  },
];

/* ------------------------------ Announcements ----------------------------- */

export const announcements: Announcement[] = [
  {
    id: 1,
    title: `${currentAcademicSession()} admission applications are now open. Apply before the deadline.`,
    date: "2026-06-20",
    tag: "Admission",
  },
  {
    id: 2,
    title: "Second semester results have been released. Check the student portal.",
    date: "2026-06-12",
    tag: "Academics",
  },
  {
    id: 3,
    title: "Library extended hours during the examination period (8am – 10pm).",
    date: "2026-06-05",
    tag: "Library",
  },
  {
    id: 4,
    title: "Resumption for the new academic session is scheduled for September 14.",
    date: "2026-05-28",
    tag: "Calendar",
  },
  {
    id: 5,
    title: "Scholarship applications for indigent students close on July 15.",
    date: "2026-05-20",
    tag: "Welfare",
  },
];

/* --------------------------------- Events --------------------------------- */

export const events: EventItem[] = [
  {
    id: 1,
    title: "Open Day & Campus Tour",
    description:
      "Prospective students and parents are invited to tour the campus, meet faculty and learn about our programmes.",
    date: "2026-07-04",
    day: "04",
    month: "Jul",
    time: "9:00 AM – 2:00 PM",
    location: "Main Campus, Administration Block",
  },
  {
    id: 2,
    title: "Postgraduate Research Symposium",
    description:
      "Masters and doctoral candidates present their research findings to faculty, peers and industry guests.",
    date: "2026-07-11",
    day: "11",
    month: "Jul",
    time: "10:00 AM – 4:00 PM",
    location: "Conference Centre, Hall B",
  },
  {
    id: 3,
    title: "Career & Internship Fair",
    description:
      "Meet recruiters from over 40 organisations offering internships, graduate programmes and full-time roles.",
    date: "2026-07-18",
    day: "18",
    month: "Jul",
    time: "11:00 AM – 5:00 PM",
    location: "Sports Complex Pavilion",
  },
  {
    id: 4,
    title: "Inter-Faculty Sports Week",
    description:
      "A week of friendly competition across football, basketball, athletics and e-sports. All students welcome.",
    date: "2026-07-25",
    day: "25",
    month: "Jul",
    time: "All Week",
    location: "University Sports Complex",
  },
  {
    id: 5,
    title: "Matriculation Ceremony",
    description:
      "Newly admitted students are formally inducted into the university at the annual matriculation ceremony.",
    date: "2026-08-01",
    day: "01",
    month: "Aug",
    time: "10:00 AM",
    location: "Main Amphitheatre",
  },
];

/* --------------------------------- Gallery -------------------------------- */

export const galleryAlbums = [
  "All",
  "Campus",
  "Convocation",
  "Sports",
  "Events",
] as const;

export const galleryPhotos: GalleryPhoto[] = [
  { id: 1, album: "Campus", src: "https://picsum.photos/seed/campus-1/800/600", caption: "Main academic block at sunrise" },
  { id: 2, album: "Campus", src: "https://picsum.photos/seed/campus-2/800/600", caption: "Central library reading hall" },
  { id: 3, album: "Campus", src: "https://picsum.photos/seed/campus-3/800/600", caption: "Science laboratory complex" },
  { id: 4, album: "Convocation", src: "https://picsum.photos/seed/convocation-1/800/600", caption: "Graduates at Convocation 2026" },
  { id: 5, album: "Convocation", src: "https://picsum.photos/seed/convocation-2/800/600", caption: "Award of first-class honours" },
  { id: 6, album: "Convocation", src: "https://picsum.photos/seed/convocation-3/800/600", caption: "Procession of fellows" },
  { id: 7, album: "Sports", src: "https://picsum.photos/seed/sports-1/800/600", caption: "Championship final kickoff" },
  { id: 8, album: "Sports", src: "https://picsum.photos/seed/sports-2/800/600", caption: "Athletics track event" },
  { id: 9, album: "Sports", src: "https://picsum.photos/seed/sports-3/800/600", caption: "Basketball tournament" },
  { id: 10, album: "Events", src: "https://picsum.photos/seed/events-1/800/600", caption: "Cultural day celebration" },
  { id: 11, album: "Events", src: "https://picsum.photos/seed/events-2/800/600", caption: "Innovation week showcase" },
  { id: 12, album: "Events", src: "https://picsum.photos/seed/events-3/800/600", caption: "Guest lecture series" },
];

export const videos: VideoItem[] = [
  {
    id: 1,
    title: "Welcome to Goinze International School of Medical Health Science and Technology",
    duration: "3:42",
    thumbnail: "https://picsum.photos/seed/video-1/800/450",
  },
  {
    id: 2,
    title: "A Day in the Life of a Goinze Student",
    duration: "5:18",
    thumbnail: "https://picsum.photos/seed/video-2/800/450",
  },
  {
    id: 3,
    title: "Inside Our Research Laboratories",
    duration: "4:05",
    thumbnail: "https://picsum.photos/seed/video-3/800/450",
  },
];

/* ------------------------------- Testimonials ------------------------------ */

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ngozi Adaeze",
    role: "Final Year, Computer Science",
    quote:
      "The lecturers genuinely care about your growth. The hands-on projects prepared me for my internship better than I ever expected.",
    initials: "NA",
  },
  {
    id: 2,
    name: "Tunde Bakare",
    role: "Alumnus, Class of 2022",
    quote:
      "Goinze gave me a foundation of discipline and curiosity. The career fair in my final year led directly to my first job offer.",
    initials: "TB",
  },
  {
    id: 3,
    name: "Mrs. Halima Yusuf",
    role: "Parent",
    quote:
      "The communication from the university is excellent. I always know how my daughter is doing, and the campus is safe and well run.",
    initials: "HY",
  },
  {
    id: 4,
    name: "David Okon",
    role: "Postgraduate, Public Health",
    quote:
      "The research support here is outstanding. My supervisor and the faculty resources have made my thesis work truly world-class.",
    initials: "DO",
  },
];

/* ---------------------------------- Stats --------------------------------- */

export const stats: Stat[] = [
  { label: "Students", value: "12,500+" },
  { label: "Programmes", value: "40+" },
  { label: "Academic Staff", value: "650+" },
  { label: "Years of Excellence", value: "35" },
];

/* --------------------------------- Faculty -------------------------------- */

export const faculties: Faculty[] = [
  {
    id: 1,
    name: "Faculty of Science",
    icon: "flask",
    description:
      "Fundamental and applied research across the physical, chemical and biological sciences.",
    departments: [
      "Computer Science",
      "Mathematics & Statistics",
      "Physics & Electronics",
      "Chemistry",
      "Biological Sciences",
    ],
    programmes: [
      { name: "B.Sc. Computer Science", level: "Undergraduate", duration: "4 years" },
      { name: "B.Sc. Biochemistry", level: "Undergraduate", duration: "4 years" },
      { name: "M.Sc. Data Science", level: "Postgraduate", duration: "18 months" },
      { name: "Ph.D. Physics", level: "Postgraduate", duration: "3–5 years" },
    ],
  },
  {
    id: 2,
    name: "Faculty of Engineering",
    icon: "cog",
    description:
      "Design-driven engineering education with strong industry partnerships and modern workshops.",
    departments: [
      "Civil Engineering",
      "Electrical & Electronic Engineering",
      "Mechanical Engineering",
      "Chemical Engineering",
    ],
    programmes: [
      { name: "B.Eng. Civil Engineering", level: "Undergraduate", duration: "5 years" },
      { name: "B.Eng. Mechatronics", level: "Undergraduate", duration: "5 years" },
      { name: "M.Eng. Structural Engineering", level: "Postgraduate", duration: "2 years" },
    ],
  },
  {
    id: 3,
    name: "Faculty of Management Sciences",
    icon: "briefcase",
    description:
      "Business, finance and entrepreneurship programmes that produce industry-ready graduates.",
    departments: [
      "Accounting",
      "Business Administration",
      "Economics",
      "Banking & Finance",
    ],
    programmes: [
      { name: "B.Sc. Accounting", level: "Undergraduate", duration: "4 years" },
      { name: "B.Sc. Economics", level: "Undergraduate", duration: "4 years" },
      { name: "MBA", level: "Postgraduate", duration: "2 years" },
    ],
  },
  {
    id: 4,
    name: "Faculty of Health Sciences",
    icon: "heart",
    description:
      "Training the next generation of clinicians, researchers and public health leaders.",
    departments: [
      "Nursing Science",
      "Public Health",
      "Medical Laboratory Science",
      "Physiotherapy",
    ],
    programmes: [
      { name: "B.NSc. Nursing", level: "Undergraduate", duration: "5 years" },
      { name: "B.Sc. Public Health", level: "Undergraduate", duration: "4 years" },
      { name: "M.P.H. Epidemiology", level: "Postgraduate", duration: "2 years" },
    ],
  },
  {
    id: 5,
    name: "Faculty of Humanities",
    icon: "book",
    description:
      "Critical thinking, communication and culture — the humanities at the heart of a rounded education.",
    departments: [
      "Mass Communication",
      "English & Literary Studies",
      "History & International Studies",
      "Linguistics",
    ],
    programmes: [
      { name: "B.A. Mass Communication", level: "Undergraduate", duration: "4 years" },
      { name: "B.A. English", level: "Undergraduate", duration: "4 years" },
      { name: "M.A. Communication Studies", level: "Postgraduate", duration: "18 months" },
    ],
  },
  {
    id: 6,
    name: "Faculty of Education",
    icon: "graduation",
    description:
      "Preparing reflective, skilled educators and education administrators for a changing world.",
    departments: [
      "Curriculum & Instruction",
      "Educational Foundations",
      "Science & Technology Education",
    ],
    programmes: [
      { name: "B.Ed. Science Education", level: "Undergraduate", duration: "4 years" },
      { name: "B.Ed. Educational Management", level: "Undergraduate", duration: "4 years" },
      { name: "M.Ed. Curriculum Studies", level: "Postgraduate", duration: "18 months" },
    ],
  },
];

/* ------------------------------ Management Team ---------------------------- */

export const managementTeam: TeamMember[] = [
  {
    id: 1,
    name: "Prof. Chinedu Balogun",
    role: "Vice-Chancellor",
    bio: "Professor of Chemical Engineering with over 30 years in academia and university leadership.",
    initials: "CB",
  },
  {
    id: 2,
    name: "Prof. Funmi Adeleke",
    role: "Deputy Vice-Chancellor, Academic",
    bio: "Leads academic strategy, quality assurance and curriculum innovation across the faculties.",
    initials: "FA",
  },
  {
    id: 3,
    name: "Dr. Emeka Nwosu",
    role: "Registrar",
    bio: "Oversees academic records, admissions and the administration of student services.",
    initials: "EN",
  },
  {
    id: 4,
    name: "Mrs. Grace Danladi",
    role: "Bursar",
    bio: "Responsible for the university's finances, budgeting and financial reporting.",
    initials: "GD",
  },
  {
    id: 5,
    name: "Prof. Ibrahim Musa",
    role: "Dean, Faculty of Science",
    bio: "Researcher in applied mathematics and champion of interdisciplinary graduate programmes.",
    initials: "IM",
  },
  {
    id: 6,
    name: "Dr. Bisi Ogunleye",
    role: "Director, Academic Planning",
    bio: "Coordinates programme accreditation, academic calendar and institutional planning.",
    initials: "BO",
  },
];

/* ---------------------------------- Staff --------------------------------- */

export const staff: StaffMember[] = [
  { id: 1, name: "Dr. Amara Okafor", role: "Director of Research", department: "Research & Innovation", email: "a.okafor@goinzedemo.edu", phone: "+1 (555) 010-2101", initials: "AO" },
  { id: 2, name: "Mr. Samuel Adeyemi", role: "Head Coach, Football", department: "Directorate of Sports", email: "s.adeyemi@goinzedemo.edu", phone: "+1 (555) 010-2102", initials: "SA" },
  { id: 3, name: "Dr. Kemi Alabi", role: "Senior Lecturer", department: "Computer Science", email: "k.alabi@goinzedemo.edu", phone: "+1 (555) 010-2103", initials: "KA" },
  { id: 4, name: "Engr. Yusuf Garba", role: "Lecturer I", department: "Civil Engineering", email: "y.garba@goinzedemo.edu", phone: "+1 (555) 010-2104", initials: "YG" },
  { id: 5, name: "Mrs. Rita Obi", role: "Admissions Officer", department: "Registry", email: "r.obi@goinzedemo.edu", phone: "+1 (555) 010-2105", initials: "RO" },
  { id: 6, name: "Dr. Paul Nwachukwu", role: "Senior Lecturer", department: "Economics", email: "p.nwachukwu@goinzedemo.edu", phone: "+1 (555) 010-2106", initials: "PN" },
  { id: 7, name: "Miss Sade Johnson", role: "Librarian", department: "University Library", email: "s.johnson@goinzedemo.edu", phone: "+1 (555) 010-2107", initials: "SJ" },
  { id: 8, name: "Dr. Musa Abdullahi", role: "Lecturer I", department: "Public Health", email: "m.abdullahi@goinzedemo.edu", phone: "+1 (555) 010-2108", initials: "MA" },
  { id: 9, name: "Mrs. Chika Eze", role: "Exams Officer", department: "Registry", email: "c.eze@goinzedemo.edu", phone: "+1 (555) 010-2109", initials: "CE" },
];

/* ------------------------------- Alumni Stories ---------------------------- */

export const alumniStories: AlumniStory[] = [
  {
    id: 1,
    name: "Linda Eze",
    graduationYear: "2010",
    programme: "B.Sc. Computer Science",
    currentRole: "Founder & CEO, BrightPay Technologies",
    story:
      "The entrepreneurship modules and the supportive computer science faculty gave me the confidence to launch my first startup before graduation. Today we employ over 200 people.",
    initials: "LE",
  },
  {
    id: 2,
    name: "Kwame Mensah",
    graduationYear: "2014",
    programme: "B.Eng. Civil Engineering",
    currentRole: "Lead Structural Engineer, Meridian Builds",
    story:
      "The capstone design projects at Goinze were real-world problems, not textbook exercises. That practical grounding has defined my entire engineering career.",
    initials: "KM",
  },
  {
    id: 3,
    name: "Aisha Bello",
    graduationYear: "2017",
    programme: "B.Sc. Nursing",
    currentRole: "Public Health Specialist, WHO Regional Office",
    story:
      "Community outreach programmes during my clinical years showed me the impact of preventive care. Goinze shaped me into an advocate for the communities that need it most.",
    initials: "AB",
  },
  {
    id: 4,
    name: "Tunde Bakare",
    graduationYear: "2022",
    programme: "B.Sc. Accounting",
    currentRole: "Audit Associate, Global Assurance Firm",
    story:
      "I secured my graduate role through the university career fair. The accounting department's emphasis on professional certifications meant I started my job already exam-ready.",
    initials: "TB",
  },
];

/* ----------------------------------- Fees ---------------------------------- */

export const fees: FeeRow[] = [
  { programme: "Undergraduate — Humanities & Education", application: "$50", tuition: "$1,200 / year", total: "$1,250" },
  { programme: "Undergraduate — Science & Management", application: "$50", tuition: "$1,500 / year", total: "$1,550" },
  { programme: "Undergraduate — Engineering", application: "$50", tuition: "$1,800 / year", total: "$1,850" },
  { programme: "Undergraduate — Health Sciences", application: "$50", tuition: "$2,000 / year", total: "$2,050" },
  { programme: "Postgraduate — Taught Masters", application: "$75", tuition: "$2,500 / year", total: "$2,575" },
  { programme: "Postgraduate — Research (M.Phil / Ph.D.)", application: "$75", tuition: "$3,000 / year", total: "$3,075" },
];

/* --------------------------- Programmes (for forms) ------------------------ */

export const programmeOptions = [
  "B.Sc. Computer Science",
  "B.Sc. Biochemistry",
  "B.Eng. Civil Engineering",
  "B.Eng. Mechatronics",
  "B.Sc. Accounting",
  "B.Sc. Economics",
  "B.NSc. Nursing",
  "B.Sc. Public Health",
  "B.A. Mass Communication",
  "B.Ed. Science Education",
  "M.Sc. Data Science",
  "MBA",
  "M.P.H. Epidemiology",
];

/* ------------------------------ Contact details ---------------------------- */

export const contactInfo = {
  address: "123 University Avenue, Goinze City, GC 10001",
  phone: "+1 (555) 010-2030",
  email: "info@goinzedemo.edu",
  hours: "Monday – Friday, 8:00 AM – 5:00 PM",
};
