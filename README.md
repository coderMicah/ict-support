# ict-support

Internal knowledge base and ICT support portal built with TanStack Start, Better Auth, PostgreSQL, and Drizzle.

## Stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework (file-based routing, server functions)
- [Better Auth](https://www.better-auth.com) — authentication with role-based access control
- [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) — data layer
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Biome](https://biomejs.dev/) — linting and formatting

## Getting Started

```bash
pnpm install
pnpm db:generate   # generate migrations
pnpm db:migrate    # apply migrations to the database
pnpm db:seed       # create the admin and user seed accounts
pnpm dev
```

Environment variables live in `.env.local` (not committed):

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_URL` — public base URL of the app
- `BETTER_AUTH_SECRET` — Better Auth signing secret
- `ADMIN_*` / `USER_*` — seed account credentials

### Seed accounts

| Role  | Email             | Password      | Name        |
| ----- | ----------------- | ------------- | ----------- |
| admin | `admin@ict.local` | `AdminPass123!` | Head of ICT |
| user  | `user@ict.local`  | `UserPass123!`  | Portal User |

## Project Status

Current feature: authentication with role-based access control (`feature/auth`).

- Better Auth with email/password and session cookies
- Roles: `admin` (Head of ICT) and `user` (ICT Officer) via Better Auth's access control
- Protected routes and server-function guards (`src/server/guard.ts`)

## Branching

Work happens on feature branches off `main`:

```bash
git checkout -b feature/<name>
# ... make changes ...
git push -u origin feature/<name>
```
