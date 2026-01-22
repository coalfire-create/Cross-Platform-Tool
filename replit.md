# 이강학원 (Lee Gang Academy)

## Overview

This is a cross-platform web application for a Korean academy (학원) that enables students to reserve question sessions with teachers. The system implements a whitelist-based registration where only pre-approved students can create accounts. Students can book either on-site or online question sessions, while teachers have a dashboard to view and manage reservations.

**Core Features:**
- Phone number + password authentication with whitelist verification
- Student reservation system for question sessions (Monday-Friday, 4 slots per period)
- Photo upload requirement for question submissions
- Teacher dashboard with seat-number-prominent display for quick student identification
- Mobile-first design with bottom navigation for students

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React with TypeScript, bundled via Vite
- **Routing:** Wouter (lightweight React router)
- **State Management:** TanStack React Query for server state
- **UI Components:** shadcn/ui with Radix primitives, styled with Tailwind CSS
- **Form Handling:** React Hook Form with Zod validation
- **File Uploads:** Uppy with AWS S3 integration for presigned URL uploads

### Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript (ESM modules)
- **Authentication:** Passport.js with Local Strategy (phone + password)
- **Session Management:** Express sessions with PostgreSQL store (connect-pg-simple)
- **API Design:** RESTful endpoints defined in shared/routes.ts with Zod schemas

### Data Storage
- **Database:** PostgreSQL with Drizzle ORM
- **Schema Location:** shared/schema.ts (shared between client and server)
- **Migrations:** Drizzle Kit with `db:push` command
- **Object Storage:** Google Cloud Storage integration for file uploads (Replit sidecar)

### Key Database Tables
- `allowed_students` - Whitelist with name, phone_number, seat_number
- `users` - Registered users with role (student/teacher)
- `schedules` - Available time slots (day + period)
- `reservations` - Bookings with userId, scheduleId, type (onsite/online), photoUrl

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components including shadcn/ui
│       ├── hooks/        # Custom React hooks (auth, reservations, etc.)
│       ├── pages/        # Route pages
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database operations
│   └── replit_integrations/  # Object storage service
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API contract with Zod schemas
└── migrations/       # Database migrations
```

### Authentication Flow
1. User enters phone number during signup
2. System checks `allowed_students` table for whitelist match
3. If found, user creates password; name and seat_number are auto-populated from whitelist
4. Login uses phone + password via Passport Local Strategy
5. Sessions stored in PostgreSQL

### Build & Development
- **Dev:** `npm run dev` - Runs Vite dev server with HMR
- **Build:** `npm run build` - Bundles client with Vite, server with esbuild
- **Production:** `npm start` - Serves built application

## External Dependencies

### Database
- **PostgreSQL** - Primary database via DATABASE_URL environment variable
- **Drizzle ORM** - Type-safe database operations

### File Storage
- **Google Cloud Storage** - For question photo uploads
- **Replit Sidecar** - Token management for GCS authentication (localhost:1106)

### Authentication & Sessions
- **Passport.js** - Authentication middleware
- **connect-pg-simple** - PostgreSQL session store

### UI Framework
- **shadcn/ui** - Component library (New York style)
- **Radix UI** - Accessible primitive components
- **Tailwind CSS** - Utility-first styling

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `PUBLIC_OBJECT_SEARCH_PATHS` - (Optional) Public object storage paths