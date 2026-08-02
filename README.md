# Goinzeschool

**Enterprise School Management ERP** — a complete, multi-tenant platform for higher-education institutions covering the public website, admissions, finance, CBT examinations, results, student & lecturer portals, digital ID, communication, and system administration.

> This is not "just a school portal". It is an enterprise-grade ERP built from the MOU requirements and expanded to a production-ready feature set.

## Monorepo layout

```
goinzeschool/
├── apps/
│   ├── api/        NestJS REST API (backend, deploy: Hetzner)
│   ├── web/        Public school website (Next.js, deploy: Vercel)
│   ├── admin/      School administration portal (Next.js)
│   ├── student/    Student portal (Next.js)
│   └── lecturer/   Lecturer portal (Next.js)
├── packages/
│   ├── database/       Prisma schema + generated client (@goinze/database)
│   ├── shared-types/   Shared enums, roles, DTO contracts (@goinze/shared-types)
│   └── shared-utils/   Grade/GPA/receipt/date helpers (@goinze/shared-utils)
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

## Tech stack

| Layer         | Choice                                             |
|---------------|----------------------------------------------------|
| Frontend      | Next.js 16, React, Tailwind CSS, shadcn/ui         |
| Backend       | NestJS + TypeScript, REST API                      |
| Database      | PostgreSQL (Neon) via Prisma ORM                   |
| Auth          | JWT + Role-Based Access Control (RBAC), Auth.js    |
| Storage       | Cloudinary (images & documents)                    |
| Payments      | Flutterwave                                        |
| Cache / Queue | Redis + BullMQ                                     |
| Infra         | Vercel (web apps), Hetzner (API)                   |

## User roles

Super Administrator · School Administrator · Admission Officer · Accountant · Lecturer · Student · Parent (optional)

## Modules (20)

Public Website · Authentication · Student Management · Admission Management · Academic Management · Course Registration · Finance System · Digital Receipts · Result Management · CBT System · Attendance · Digital ID Card · Communication · Staff Management · Reports · Analytics · Document Management · Settings · Security · System Administration

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env   # then fill in Neon, Cloudinary, Flutterwave, Redis credentials

# 3. Set up the database
pnpm db:generate       # generate Prisma client
pnpm db:push           # push schema to Neon (or: pnpm db:migrate)
pnpm db:seed           # seed roles + demo data

# 4. Run everything in dev
pnpm dev
```

### Default dev ports

| App       | Port  |
|-----------|-------|
| api       | 4000  |
| web       | 3000  |
| admin     | 3001  |
| student   | 3002  |
| lecturer  | 3003  |

## Scripts

- `pnpm dev` — run all apps in watch mode (Turborepo)
- `pnpm build` — build all apps and packages
- `pnpm lint` / `pnpm typecheck` / `pnpm test`
- `pnpm db:generate | db:push | db:migrate | db:seed`

## License

Proprietary — © Goinzeschool. All rights reserved.
