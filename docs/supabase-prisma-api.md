# Supabase + Prisma API Design

## Data Flow

- Login/register uses Supabase Auth REST API from the browser.
- The app stores the Supabase access token locally and sends it to `/api/*` as `Authorization: Bearer <token>`.
- SvelteKit API routes verify the token through Supabase Auth, then read/write Supabase Postgres through Prisma.
- `profiles` is auto-created when a new `auth.users` row appears, and API routes also ensure it exists on login.

## Endpoints

| Endpoint                      | Method         | Purpose                                     |
| ----------------------------- | -------------- | ------------------------------------------- |
| `/api/profile`                | `GET`          | Current Auth user + `profiles` row          |
| `/api/profile`                | `POST` / `PUT` | Update profile display name                 |
| `/api/dashboard`              | `GET`          | Data for `src/routes/main/+page.svelte`     |
| `/api/courses`                | `GET`          | Active courses with chapters and lessons    |
| `/api/lessons/[lessonId]`     | `GET`          | Single lesson, including `simulator_config` |
| `/api/quizzes?chapterId=...`  | `GET`          | Active quizzes and public question data     |
| `/api/progress`               | `GET`          | Current user lesson progress                |
| `/api/progress`               | `POST`         | Create/update one `user_progress` row       |
| `/api/learning-sessions`      | `POST`         | Start a lesson session                      |
| `/api/learning-sessions/[id]` | `PATCH`        | End a lesson session and calculate duration |
| `/api/user-answers`           | `POST`         | Submit one answer and store score           |

## Setup

1. Set `.env` from `.env.example`.
2. Install dependencies and generate Prisma Client.
3. Apply `prisma/migrations/202605030001_learning_schema/migration.sql` to Supabase.
4. Optional: apply `prisma/seed-learning.sql` to create the first sample course.
