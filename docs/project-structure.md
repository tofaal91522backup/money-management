# Project Structure

This is the route and responsibility contract established in Phase 1. Later phases should extend these boundaries instead of putting feature logic inside page files.

```text
app/
  (auth)/login/             Public login route
  (dashboard)/              Authenticated application routes
    page.tsx                Dashboard
    accounts/               Accounts
    budgets/                Budgets
    categories/             Categories
    loans/                  Loans and repayments
    reports/                Reports
    settings/               User preferences
    transactions/           History and transaction forms
components/
  layout/                   Application shell and page layout
  providers/                Client context providers
  ui/                       Reusable, feature-neutral UI primitives
config/                     Application and navigation configuration
features/
  accounts/                 Account UI, validation, queries, actions
  auth/                     Login and session behavior
  budgets/                  Budget UI, validation, queries, actions
  categories/               Category UI, validation, queries, actions
  dashboard/                Dashboard composition and summaries
  loans/                    Loan and repayment behavior
  reports/                  Reporting queries and presentation
  transactions/             Income, expense, transfer behavior
lib/
  auth/                     Server authentication utilities
  db/                       Database client and data-access helpers
  money/                    Shared financial calculations
  utils.ts                  Generic utilities
types/                      Shared cross-feature TypeScript contracts
```

## Boundaries

- Route files compose a page; they do not contain database or financial logic.
- Feature code owns its forms, validation, server-data hooks, and actions.
- Shared UI components have no knowledge of financial features.
- Server data is managed through TanStack Query on the client boundary.
- Financial writes remain server-authoritative and atomic.
- Database access stays on the server and is always scoped to the signed-in user.
- Route paths come from `config/navigation.ts` instead of being repeated across navigation components.
