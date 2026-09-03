# Local Database Setup

The application uses SQLite through Prisma for the first version. SQLite stores the database in one local file and needs no external database server.

## Before running the app

1. Copy `.env.example` to `.env` if it is missing.
2. Set `INITIAL_USER_EMAIL` to the email you want to use for login.
3. Set `INITIAL_USER_PASSWORD` to a strong, unique password. The seed script rejects the example password.
4. Run `npm run db:generate` after any schema update.
5. Apply migrations with `npm run db:migrate`.
6. Run `npm run db:seed` once to create the initial user, preferences, and default income/expense categories.

## Money representation

All money is stored as integer minor units, never as floating-point values. For example, `1250.50 BDT` is stored as `125050`. This keeps totals, balance calculations, reports, and repayments exact.

## Data safety rules

- The database file and `.env` are ignored by Git.
- The seed command is safe to re-run; it does not duplicate the initial user or default categories.
- Passwords are hashed before storage.
- User-owned records are linked to `User`; future queries/actions must always scope by the authenticated user ID.
- Account/category history is preserved through archiving rather than hard deletion.
