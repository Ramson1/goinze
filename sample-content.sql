-- Sample data for News, Announcements, and Events
-- Run this SQL in your database to populate the website with sample content
-- Make sure to replace 'YOUR_SCHOOL_ID' with the actual school ID from your database

-- First, let's get the school ID (run this to find it)
-- SELECT id, name, slug FROM "School" WHERE slug = 'goinze-demo';

-- ============================================
-- NEWS POSTS (Stay Informed - Latest News)
-- ============================================

INSERT INTO "NewsPost" (id, "schoolId", title, slug, category, excerpt, body, "coverUrl", published, "publishedAt", "createdAt")
VALUES 
(
  'clxx1news001',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Goinze Launches State-of-the-Art Medical Simulation Center',
  'goinze-launches-medical-simulation-center',
  'Campus',
  'New facility will enhance practical training for health science students with cutting-edge technology.',
  'The Goinze International School of Medical Health Science and Technology today inaugurated its new Medical Simulation Center, a N500 million facility equipped with the latest in healthcare training technology. The center features high-fidelity patient simulators, virtual reality surgical training modules, and emergency response simulation rooms. Students across all health science programs will benefit from hands-on training in a controlled, realistic environment before engaging with actual patients.',
  NULL,
  true,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  'clxx1news002',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Student Research Team Wins National Health Innovation Award',
  'student-research-wins-national-award',
  'Achievement',
  'Final year students recognized for innovative approach to community health diagnostics.',
  'A team of four final year Public Health students has been awarded first place at the National Health Innovation Competition for their project "Mobile Health Screening Kiosks for Rural Communities." The team, consisting of Amina Abdullahi, Chukwuemeka Okafor, Fatima Usman, and David Eze, designed a low-cost, solar-powered kiosk capable of performing basic health diagnostics and connecting patients with remote healthcare providers. Their innovation is already being piloted in three rural communities around FCT.',
  NULL,
  true,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
(
  'clxx1news003',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'New Partnership with University Teaching Hospital for Clinical Rotations',
  'partnership-teaching-hospital',
  'Academic',
  'Students to gain enhanced clinical experience through expanded partnership.',
  'Goinze International School has signed a memorandum of understanding with the National Hospital Abuja and University of Abuja Teaching Hospital to expand clinical rotation opportunities for our medical and health science students. Under the agreement, 200 additional student placement slots will be available each academic session, giving more students hands-on experience in specialized departments including cardiology, neurology, pediatrics, and emergency medicine. The partnership also includes joint research initiatives and continuing medical education programs.',
  NULL,
  true,
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 week'
),
(
  'clxx1news004',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  '2025/2026 Admission Now Open',
  'admission-2025-2026-open',
  'Admissions',
  'Applications invited for all health science programs. Early bird discount available.',
  'The Goinze International School of Medical Health Science and Technology has opened admissions for the 2025/2026 academic session. Programs available include Community Health Extension, Public Health Technology, Medical Laboratory Technology, Pharmacy Technology, and Nursing Science. Applicants must have minimum of 5 credits in WAEC/NECO including English, Mathematics, Biology, Chemistry, and Physics. Early applicants who register before March 31, 2025 will receive 10% discount on application fees. Visit the admissions portal or contact the admissions office for more information.',
  NULL,
  true,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),
(
  'clxx1news005',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Annual Health Outreach Provides Free Services to 500+ Community Members',
  'annual-health-outreach-2025',
  'Community',
  'Students and staff provide free health screenings, education, and basic medications.',
  'Over 500 community members benefited from the school''s annual health outreach program held in Bwari Area Council. The outreach, organized by students under faculty supervision, provided free blood pressure screenings, blood sugar tests, malaria rapid diagnostic tests, health education sessions, and basic medications. The initiative aligns with the school''s commitment to community health development and gives students practical experience in public health outreach. Plans are underway to make the outreach a quarterly event.',
  NULL,
  true,
  NOW() - INTERVAL '2 weeks',
  NOW() - INTERVAL '2 weeks'
);

-- ============================================
-- ANNOUNCEMENTS (Notice Board)
-- ============================================

INSERT INTO "Announcement" (id, "schoolId", title, body, audience, pinned, "publishedAt", "createdAt")
VALUES 
(
  'clxx1ann001',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Second Semester Examination Timetable Released',
  'The examination timetable for the second semester of the 2024/2025 academic session has been released. Examinations will commence on Monday, February 10, 2025 and end on Friday, February 28, 2025. Students can view their personal exam schedules on the student portal. Please note that examination malpractice will not be tolerated. All students must present their ID cards before entering any examination hall.',
  'STUDENTS',
  true,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  'clxx1ann002',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Staff Development Workshop on Modern Teaching Methods',
  'All academic staff are invited to attend a compulsory staff development workshop on "Innovative Teaching Methods in Health Science Education" scheduled for Saturday, February 15, 2025 from 9:00 AM to 4:00 PM in the Main Auditorium. The workshop will cover topics including problem-based learning, simulation-based education, assessment strategies, and integration of technology in teaching. Attendance is mandatory and certificates will be provided.',
  'STAFF',
  false,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),
(
  'clxx1ann003',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Library Extended Hours During Examination Period',
  'To support students during the examination period, the school library will operate extended hours from Monday, February 10 to Friday, February 28, 2025. New hours: 7:00 AM - 10:00 PM (Monday-Friday) and 9:00 AM - 6:00 PM (Saturday-Sunday). The library will have additional staff on duty to assist with research and reference queries. Printing services will also be available during these hours.',
  'ALL',
  false,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
(
  'clxx1ann004',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Fee Payment Deadline for Second Semester',
  'All students are reminded that school fees for the second semester of the 2024/2025 academic session must be paid on or before Friday, February 7, 2025. Late payment will attract a penalty of 10% of the outstanding amount. Payment can be made via bank transfer to the school''s official account or online through the student portal. Students with outstanding fees will not be allowed to register for examinations. For payment issues, please contact the Bursary Department.',
  'STUDENTS',
  false,
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 week'
),
(
  'clxx1ann005',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'New Student Orientation Program',
  'All newly admitted students for the 2025/2026 academic session are invited to attend a mandatory orientation program scheduled for Monday, March 3, 2025 at 9:00 AM in the Main Auditorium. The orientation will cover school policies, academic expectations, student services, campus facilities, and introduction to faculty members. Continuing students are not required to attend. Please bring your admission letter and valid ID for registration.',
  'ALL',
  false,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
);

-- ============================================
-- EVENTS (What's On - Upcoming Events)
-- ============================================

INSERT INTO "Event" (id, "schoolId", title, description, location, "startsAt", "endsAt", "coverUrl", "createdAt")
VALUES 
(
  'clxx1evt001',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Open Day & Campus Tour',
  'Prospective students and parents are invited to visit our campus, meet faculty members, tour our facilities including laboratories, simulation centers, and library. Learn about our programs, admission requirements, and student life. Registration desks will be available for on-the-spot applications.',
  'Main Campus, Bwari Area Council, FCT Abuja',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '4 hours',
  NULL,
  NOW()
),
(
  'clxx1evt002',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Career Fair & Health Industry Networking Event',
  'Annual career fair bringing together leading hospitals, diagnostic centers, pharmaceutical companies, and public health organizations. Students can explore career opportunities, attend industry talks, and network with potential employers. All students are encouraged to attend in professional attire and bring copies of their CVs.',
  'School Auditorium',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days' + INTERVAL '6 hours',
  NULL,
  NOW()
),
(
  'clxx1evt003',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'World Health Day Celebration',
  'Join us in commemorating World Health Day with the theme "Health for All." Activities include a health walk starting from the school premises, free community health screenings, health education sessions, and a symposium featuring public health experts. All students, staff, and community members are welcome to participate.',
  'School Grounds & Bwari Community',
  NOW() + INTERVAL '21 days',
  NOW() + INTERVAL '21 days' + INTERVAL '8 hours',
  NULL,
  NOW()
),
(
  'clxx1evt004',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Inter-Departmental Sports Competition',
  'Annual sports competition between departments featuring football, basketball, volleyball, table tennis, and athletics. Students are encouraged to participate and support their departments. Refreshments will be available. Closing ceremony and prize presentation will hold on Friday.',
  'School Sports Complex',
  NOW() + INTERVAL '28 days',
  NOW() + INTERVAL '32 days',
  NULL,
  NOW()
),
(
  'clxx1evt005',
  (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1),
  'Matriculation Ceremony for 2025/2026 Session',
  'Official matriculation ceremony for newly admitted students. Gowns will be distributed one week before the event. Parents and guardians are welcome to attend. The ceremony will be followed by a reception and photo session.',
  'Main Auditorium',
  NOW() + INTERVAL '35 days',
  NOW() + INTERVAL '35 days' + INTERVAL '3 hours',
  NULL,
  NOW()
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View inserted news posts
SELECT id, title, category, "publishedAt" FROM "NewsPost" 
WHERE "schoolId" = (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1)
ORDER BY "publishedAt" DESC;

-- View inserted announcements
SELECT id, title, audience, pinned, "publishedAt" FROM "Announcement"
WHERE "schoolId" = (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1)
ORDER BY "publishedAt" DESC;

-- View inserted events
SELECT id, title, location, "startsAt", "endsAt" FROM "Event"
WHERE "schoolId" = (SELECT id FROM "School" WHERE slug = 'goinze-demo' LIMIT 1)
ORDER BY "startsAt" ASC;
