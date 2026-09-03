# Money Management App — Full Implementation Plan

## পরিকল্পনার নিয়ম

এই document অনুসরণ করে অ্যাপটি একবারে সম্পূর্ণ বানানো হবে না। ব্যবহারকারী প্রতিবার `next` বললে শুধু পরবর্তী অসম্পূর্ণ Phase-এর কাজ করা হবে। প্রতিটি Phase শেষে:

- ওই Phase-এর code সম্পূর্ণ করা হবে
- প্রয়োজনীয় validation ও error handling করা হবে
- typecheck চালানো হবে
- build চালানো হবে না
- কী সম্পন্ন হয়েছে তা সংক্ষেপে জানানো হবে
- এই document-এ Phase-এর status আপডেট করা হবে

Status-এর অর্থ:

- `[ ]` শুরু হয়নি
- `[~]` কাজ চলছে
- `[x]` সম্পন্ন

---

## ১. Product Goal

একজন ব্যবহারকারী যেন নিজের সব টাকা এবং আর্থিক দায় এক জায়গা থেকে সহজে নিয়ন্ত্রণ করতে পারে:

- Cash, Bank ও Mobile Wallet-এর বর্তমান balance
- আয় কোথা থেকে এসেছে
- কোন খাতে কত খরচ হয়েছে
- নিজের account-এর মধ্যে transfer
- কাকে কত টাকা ধার দেওয়া হয়েছে
- কার কাছ থেকে কত টাকা ধার নেওয়া হয়েছে
- ধার কতটুকু ফেরত এসেছে বা পরিশোধ হয়েছে
- মাসিক budget ও spending progress
- মাসিক report ও প্রয়োজনীয় insight

অ্যাপটির মূল নীতি: **প্রতিটি টাকা কোথা থেকে এলো, কোথায় গেল এবং বর্তমানে কোথায় আছে—এই তিনটি বিষয় সবসময় সঠিক থাকতে হবে।**

---

## ২. Authentication Plan

### প্রয়োজনীয় Flow

- শুধু একটি Login page থাকবে।
- public Signup page থাকবে না।
- Login সফল হলে ব্যবহারকারী Home/Dashboard page-এ যাবে।
- Login না করা অবস্থায় কোনো protected page খোলা যাবে না।
- protected URL সরাসরি খুললে Login page-এ পাঠানো হবে।
- আগে থেকেই Login করা থাকলে Login page খুললে Dashboard-এ পাঠানো হবে।
- Logout করলে active session শেষ হবে এবং Login page-এ ফিরে যাবে।
- session expire হলে নিরাপদভাবে আবার Login page দেখাবে।

### Login Form

- Email
- Password
- Show/Hide password
- Remember/session behavior
- Login button
- Loading state
- ভুল তথ্যের error message
- প্রয়োজনীয় field validation

### Account তৈরির নিয়ম

Signup না থাকায় প্রথম ব্যবহারকারীর account development/setup-এর সময় তৈরি করা হবে। Password কখনো plain text হিসেবে রাখা হবে না। ভবিষ্যতে প্রয়োজন হলে আলাদা admin-controlled user creation যোগ করা যাবে, কিন্তু প্রথম version-এ সেটি scope-এর বাইরে থাকবে।

### Security Rules

- শুধু UI লুকিয়ে protection করা হবে না; server-side access-ও যাচাই হবে।
- প্রতিটি data operation বর্তমান authenticated user-এর ownership যাচাই করবে।
- একজন user অন্য user-এর transaction/account দেখতে বা পরিবর্তন করতে পারবে না।
- Login error থেকে email আছে কি নেই তা আলাদাভাবে প্রকাশ করা হবে না।
- sensitive তথ্য client response বা log-এ দেওয়া হবে না।

---

## ৩. Main Navigation ও User Flow

Login করার পর ব্যবহারকারী Dashboard-এ যাবে। প্রধান navigation:

1. Dashboard
2. Transactions
3. Accounts
4. Loans
5. Budgets
6. Reports
7. Categories
8. Settings

Desktop-এ sidebar এবং mobile-এ compact bottom navigation বা drawer থাকবে। সব screen থেকে `Add Transaction` action সহজে পাওয়া যাবে।

### Primary Daily Flow

1. Login
2. Dashboard-এ বর্তমান অবস্থা দেখা
3. `Add Transaction` চাপা
4. Income, Expense, Transfer অথবা Loan নির্বাচন
5. Amount, Account এবং প্রয়োজনীয় Category/Person নির্বাচন
6. Save
7. Balance, recent transactions, budget ও report সঙ্গে সঙ্গে আপডেট

---

## ৪. Visual Design Plan

### Design Direction

- পরিষ্কার, modern এবং calm financial dashboard
- গুরুত্বপূর্ণ amount ও status সহজে scan করা যাবে
- অতিরিক্ত decoration নয় বা অপ্রয়োজনীয় animation থাকবে না
- cards-ভিত্তিক layout হলেও hierarchy পরিষ্কার রাখা হবে
- mobile-first responsive design
- সব interactive element keyboard দিয়ে ব্যবহারযোগ্য হবে

### Light Mode

- soft off-white page background
- white surface/card
- dark readable text
- green primary/accent color
- subtle border ও shadow
- Income-এর জন্য জন্য positive green
- Expense-এর জন্য controlled red/orange
- Transfer-এর জন্য blue
- Loan status-এর জন্য context অনুযায়ী amber/blue/red

### Dark Mode

- pure black-এর পরিবর্তে comfortable dark neutral background
- surface এবং background-এর মধ্যে পরিষ্কার contrast
- muted text-ও readable রাখা
- chart, border, form এবং hover state-এর জন্য আলাদা dark tokens
- Income/, Expense, Transfer ও warning-এর semantic color dark mode-এও পরিষ্কার রাখা

### Theme Behavior

- Light, Dark ও System—তিনটি option
- নির্বাচিত theme মনে রাখা
- page reload-এর সময় incorrect theme flash এড়ানো
- Login page এবং protected app—দ জায়গাতেই theme control

### Shared UI Components

- App shell
- Sidebar/mobile navigation
- Page header
- Theme toggle
- User menu ও logout
- Summary card card
- Account card
- Transaction row
- Amount display
- Category badge
- Status badge
- Loan card
- Budget progress
- Form field wrappers
- Amount input
- Account selector
- Category selector
- Person selector
- Date input
- Filter panel
- Search input
- Modal/Sheet
- Confirmation dialog
- Empty state
- Loading skeleton
- Error state
- Toast/feedback message
- Pagination controls

---

## ৫. Core Financial Model

### Account

টাকা রাখার প্রতিটি জায়গা একটি Account:

- Cash
- Bank
- bKash
- Nagad
- Rocket
- Savings
- Custom wallet/account

Account-এর তথ্য:

- Name
- Type
- Opening balance
- Optional account identifier
- Color/Icon
- Active/Archived status
- User ownership

Opening balance Income নয়। Archived account history-তে থাকবে, কিন্তু নতুন transaction-এ default option হিসেবে দেখাবে না। Balance থাকা account delete করার পরিবর্তে archive করাই preferred behavior।

### Category

Category দুই ধরনের:

- Income category
- Expense category

Default examples:

- বাবা/পরিবার থেকে পাওয়া
- Salary
- Freelancing
- Business
- Gift
- অন্যান্য আয়
- যাতায়াত
- Restaurant
- Groceries
- বাসা ভাড়া
- বিদ্যুৎ
- গ্যাস
- পানি
- Internet/Wi-Fi
- Mobile recharge
- চিকিৎসা
- শিক্ষা
- Shopping
- বিনোদন
- Subscription
- পরিবার
- দান
- ব্যক্তিগত যত্ন
- ভ্রমণ
- জরুরি খরচ
- অন্যান্য খরচ

ব্যবহারকারী custom Category তৈরি, edit ও archive করতে পারবে। ব্যবহৃত Category সরাসরি delete করা হবে না।

### Transaction Types

#### Income

- Account balance বাড়বে
- Income report-এ যোগ হবে
- Income category প্রয়োজন হবে

#### Expense

- পর্যাপ্ত balance থাকার নিয়ম app setting অনুযায়ী enforce বা warning করবে
- Account balance কমবে
- Expense report এবং সংশ্লিষ্ট budget-এ যোগ হবে
- Expense category প্রয়োজন হবে

#### Transfer

- Source account কমবে
- Destination account বাড়বে
- মোট net worth পরিবর্তন হবে না
- Income/Expense report-এ মূল transferred amount গণনা হবে না
- Source ও destination একই হতে পারবে না
- Transfer fee থাকলে সেটি আলাদা Expense effect তৈরি করবে

#### Balance Adjustment

বাস্তব balance এবং app balance না মিললে controlled adjustment করা যাবে। Adjustment-এর reason বাধ্যতামূলক হবে এবং audit/history-তে দেখা যাবে। এটি সাধারণ Income/Expense report বিকৃত করবে না।

---

## ৬. Loan Logic

### Loan Types

- **Receivable:** আমি টাকা দিয়েছি, ফেরত পাব
- **Payable:** আমি টাকা নিয়েছি, ফেরত দেব

### Loan Information

- Person name
- Optional phone/contact note
- Type
- Original amount
- Account
- Start date
- Optional due date
- Description/note
- Repaid amount
- Remaining amount
- Status

### Status

- Active
- Partially paid
- Paid
- Overdue
- Cancelled/adjusted, only with reason

### Financial Effect

- Receivable তৈরি: Account কমবে, Expense বাড়বে না
- Receivable repayment: Account বাড়বে, Income বাড়বে না
- Payable তৈরি: Account বাড়বে, Income বাড়বে না
- Payable repayment: Account কমবে, Expense বাড়বে না

### Repayment Rules

- Partial repayment গ্রহণযোগ্য
- Repayment remaining amount-এর বেশি হতে পারবে না
- প্রতিটি repayment-এর date, amount, account ও note থাকবে
- ভুল repayment edit/delete করলে account ও loan balance ঠিকভাবে reverse হবে
- Remaining amount শূন্য হলে status Paid হবে
- due date পার হয়ে remaining থাকলে Overdue দেখাবে

---

## ৭. Budget Logic

- মাসভিত্তিক total budget তৈরি করা যাবে
- Category-ভিত্তিক budget তৈরি করা যাবে
- একই মাসে একই Category-এর duplicate active budget থাকবে না
- শুধু Expense transaction budget ব্যবহার করবে
- Loan, Transfer ও Income budget-এ গণনা হবে না
- Expense edit/delete হলে progress আবার ঠিক হবে
- 80% হলে warning
- 100% পার হলে over-budget state
- বর্তমান, আগের ও পরের মাস navigate করা যাবে

---

## ৮. Dashboard Details

Dashboard-এ থাকবে:

- Total available balance
- Account-wise balance summary
- Current month income
- Current month expense
- Current month net cash flow
- Total receivable
- Total payable
- Overdue loan count/amount
- Budget progress
- Recent transactions
- Top expense categories
- Income vs expense overview
- Quick add transaction
- Balance hide/show control

Dashboard-এর প্রতিটি সংখ্যা একই date range এবং একই financial rules অনুসরণ করবে। Empty account বা transaction না থাকলে onboarding-focused empty state দেখাবে।

---

## ৯. Transactions Page

### List Information

- Type icon
- Category/transaction label
- Account বা transfer route
- Date
- Optional note
- Amount
- Income/Expense/Transfer status color

### Filter ও Search

- Date range
- Transaction type
- Account
- Category
- Minimum/maximum amount
- Search by note, category বা person
- Clear all filters

### Actions

- View details
- Edit
- Delete with confirmation
- pagination বা incremental loading

Edit/Delete-এর সময় আগের financial effect reverse করে নতুন effect apply করতে হবে। এই অংশে correctness visual speed-এর চেয়ে বেশি গুরুত্বপূর্ণ।

---

## ১০. Forms ও Validation

### Shared Rules

- Amount অবশ্যই positive হবে
- currency precision ঠিক রাখতে floating-point calculation ব্যবহার করা হবে না
- প্রয়োজনীয় field-এর পাশে clear message থাকবে
- submit চলাকালে duplicate submission বন্ধ থাকবে
- error হলে user input হারাবে না
- successful save-এর পর clear feedback থাকবে
- date future হলে transaction scheduled হবে নাকি reject হবে—প্রথম version-এ future regular transaction reject করা হবে

### Transaction Form Behavior

Type অনুযায়ী field পরিবর্তিত হবে:

- Income: To Account + Income Category
- Expense: From Account + Expense Category
- Transfer: From Account + To Account + Optional Fee
- Loan: Direction + Person + Account + Optional Due Date

Advanced field defaultভাবে compact থাকবে, যাতে দৈনিক transaction দ্রুত যোগ করা যায়।

---

## ১১. Reports

প্রথম version-এর report:

- Selected month summary
- Income বনাম Expense
- Category-wise expense breakdown
- Account-wise activity
- Top expenses
- Income source breakdown
- বাবার পাঠানো মোট টাকা
- Receivable/Payable summary
- previous month comparison

Charts-এর পাশাপাশি সংখ্যাগুলো text/table আকারেও থাকবে, যাতে শুধু color বা chart-এর ওপর নির্ভর করতে না হয়।

---

## ১২. Settings

- Profile summary
- Currency preference; প্রথম default BDT
- Theme: Light/Dark/System
- Balance visibility preference
- Default transaction account
- Archived accounts/categories management
- Logout

প্রথম version-এ currency conversion থাকবে না। সব account একই selected currency ব্যবহার করবে।

---

## ১৩. Data Correctness ও Edge Cases

- একই action double-click করলে duplicate transaction তৈরি হবে না
- transaction save-এর মাঝখানে failure হলে partial balance update থাকবে না
- deleted/archived account নতুন transaction-এ ব্যবহার করা যাবে না
- history থাকা account/category hard-delete করা যাবে না
- transfer-এর দুই পাশ সবসময় একসঙ্গে সফল বা ব্যর্থ হবে
- loan এবং repayment update একইভাবে atomic হবে
- timezone অনুযায়ী date boundary consistent থাকবে
- amount display সব জায়গায় একই formatting ব্যবহার করবে
- zero-value transaction গ্রহণ করা হবে না
- invalid ownership ID দিয়ে data access বন্ধ থাকবে
- filter empty result-এর জন্য useful empty state থাকবে
- dashboard total stored balance এবং transaction history-এর সঙ্গে consistent থাকবে

---

## ১৪. Suggested Folder Responsibilities

Implementation-এর সময় code feature অনুযায়ী ভাগ হবে। Exact folder Phase 1-এ বর্তমান project structure দেখে final করা হবে। Responsibility হবে:

- route/page files শুধু page composition করবে
- feature module নিজস্ব form, validation, query এবং business action রাখবে
- shared components শুধু reusable UI রাখবে
- financial calculation pure shared logic হিসেবে থাকবে
- authentication logic আলাদা থাকবে
- data access একটি নির্দিষ্ট layer-এ থাকবে
- server data এবং client UI state আলাদা রাখা হবে
- constants, currency/date formatter ও common types পুনরায় ব্যবহারযোগ্য থাকবে

এতে একটি বড় page file-এর মধ্যে সব code জমা হবে না এবং প্রতিটি feature আলাদাভাবে maintain/test করা যাবে।

---

## ১৫. Phase-by-Phase Execution Plan

### Phase 1 — Foundation ও Final Structure `[x]`

- বর্তমান project audit
- final route map
- scalable feature-based folders
- shared configuration
- app-wide providers-এর boundary
- base layout এবং responsive shell-এর foundation
- existing user changes preserve করা
- typecheck

Completed: application/provider boundaries, centralized app and route configuration,
responsive page container, final folder responsibility map, project metadata, and a
neutral product foundation screen. TanStack Query is available at the root provider
boundary for later feature queries.

### Phase 2 — Design System ও Theme `[x]`

- semantic light/dark color system
- typography, spacing ও responsive rules
- shared button, input, card, badge, dialog, sheet, skeleton এবং empty state
- Theme toggle on Login ও app shell
- accessible focus/error/disabled states
- typecheck

Completed: semantic light/dark financial colors, polished interactive states, responsive design tokens, and shared Button, Input, Card, Badge, Dialog, Sheet, Skeleton, and Empty State primitives. Theme selection remains available on the public foundation screen and is ready for the future login and application shells.

### Phase 3 — Data Foundation `[x]`

- User, Session, Account, Category, Transaction, Transfer, Loan, Repayment ও Budget-এর data model
- ownership ও relationship rules
- amount/date representation
- initial default categories
- initial user creation flow
- safe data setup instructions
- typecheck

Completed: SQLite/Prisma configuration, version-controlled initial schema migration,
generated Prisma client, secure initial-user seed script, default categories, shared
money formatting/conversion utilities, transaction reporting rules, and a server-only
database client with an SQLite driver adapter. Setup instructions are in
`docs/database-setup.md`.

### Phase 4 — Login-only Authentication `[x]`

- polished responsive Login page
- email/password validation
- secure credential verification
- session create/read/delete
- protected route behavior
- authenticated user redirect
- Logout flow
- loading ও error feedback
- typecheck

Completed: public login page, email/password validation, secure password verification,
opaque httpOnly session cookies, hashed session tokens in the database, session expiry,
protected route redirects, authenticated-user redirect away from login, and logout.
Proxy performs only an optimistic cookie check; server pages and actions verify the
session against the database before allowing access.

### Phase 5 — App Shell ও Navigation `[x]`

- protected desktop sidebar
- mobile navigation/drawer
- page header
- theme control
- user/logout menu
- active route state
- responsive content container
- typecheck

Completed: a protected responsive app shell, desktop sidebar, mobile drawer and bottom
navigation, centralized icon-based active navigation, page header, theme control,
account/logout menu, and protected placeholders for every planned route.

### Phase 6 — Accounts `[x]`

- account list ও total balance
- create/edit/archive account
- opening balance handling
- account card ও details
- validation এবং empty states
- typecheck

Completed: TanStack Query account loading, account balance summary, create/edit/archive
flows, opening-balance validation, account type/color/identifier fields, archived-account
restore, ownership-scoped server actions, and loading/empty/error states. Opening balance
becomes immutable once transactions are present.

### Phase 7 — Categories `[x]`

- default income/expense categories
- custom category create/edit/archive
- icon/color selection
- used category protection
- typecheck

Completed: TanStack Query category loading, income/expense filtering, custom category
create/edit/archive/restore flows, seeded default category support, ownership-scoped
server actions, and protection against changing the type of default or used categories.

### Phase 8 — Income ও Expense `[x]`

- add transaction experience
- Income/Expense forms
- financial effect rules
- validation, pending ও error states
- quick-add behavior
- typecheck

Completed: TanStack Query-powered transaction form data, income/expense entry flow,
account/category ownership validation, future-date prevention, exact minor-unit amount
parsing, insufficient-balance protection, and ledger-derived account balances that update
after a transaction is saved.

### Phase 9 — Transactions History `[x]`

- transaction list
- details view
- search, filters ও pagination
- edit এবং safe delete
- balance recalculation correctness
- typecheck

Completed: paginated TanStack Query transaction history, search and type/account/category/date filters, detail-rich rows, edit flow with balance-safe validation, and confirmation-gated delete that refreshes account balances and history.

### Phase 10 — Account Transfer `[x]`

- transfer form
- source/destination rules
- transfer fee
- linked transfer history
- edit/delete reversal logic
- typecheck

Completed: own-account transfer create/edit/delete flow, source/destination validation,
optional fee support, insufficient-balance protection, ledger-balanced account updates,
and transfer-aware transaction history and filters. Transfers do not affect income or
expense totals; only an optional fee reduces total available money.

### Phase 11 — Loans `[x]`

- Receivable/Payable tabs
- person ও loan creation
- partial repayment
- active/partial/paid/overdue status
- loan details ও history
- financial reversal rules
- typecheck

Completed: receivable/payable loan creation, account-aware loan disbursement, partial/full repayment, remaining-balance enforcement, paid/partial/overdue status, repayment history, and ledger-safe account balance updates without affecting income or expense totals.

### Phase 12 — Dashboard `[x]`

- summary cards
- account balances
- income/expense/net cash flow
- receivable/payable summary
- recent transactions
- top categories
- quick actions
- hide/show balance
- loading ও empty states
- typecheck

Completed: TanStack Query dashboard data, total active-account balance, monthly income/
expense/net cash flow, receivable/payable and overdue-loan summary, recent activity,
top monthly expense categories, and a user-controlled balance hide/show view.

### Phase 13 — Budgets `[x]`

- monthly total/category budgets
- create/edit/delete
- progress ও warning states
- month navigation
- expense update synchronization
- typecheck

Completed: monthly total/category budget create/edit/delete, duplicate prevention,
expense-only progress calculations, month navigation, 80% warning, and over-budget state.

### Phase 14 — Reports `[x]`

- monthly filters
- Income বনাম Expense
- category/account breakdown
- বাবার পাঠানো টাকার summary
- loan summary
- previous month comparison
- accessible responsive charts/tables
- typecheck

Completed: selected-month TanStack Query reports, income/expense/net summaries, previous-
month comparisons, category and income-source breakdowns, account activity, largest
expenses, Family support income, and receivable/payable/overdue loan summary. Charts
also expose their values as readable text.

### Phase 15 — Settings ও Final Polish `[x]`

- preferences
- default account
- archived item management
- global loading/error/not-found behavior
- full responsive review
- keyboard ও accessibility review
- financial edge-case review
- all code typecheck
- build নয়

Completed: profile and money preferences, persisted Light/Dark/System theme, default
account selection, default balance privacy, archived-item access through their feature
pages, global loading/error/not-found states, skip-to-content navigation, responsive and
keyboard-focused polish, migration metadata, and a final authentication/financial logic
integration review.

---

## ১৬. Explicitly Deferred Features

প্রথম complete version শেষ হওয়ার আগে নিচের feature যোগ করা হবে না:

- Public signup
- Forgot password/email recovery
- Multiple currencies ও exchange rate
- Bank API synchronization
- Receipt OCR
- Push/email notification
- Shared family account
- Data import/export
- Recurring transaction automation
- Advanced forecasting

Core version stable হওয়ার পরে এগুলোর আলাদা plan করা যাবে।

---

## ১৭. Completion Criteria

App complete বলা যাবে যখন:

- Login ছাড়া protected data access করা যায় না
- Login ও Logout নির্ভরযোগ্যভাবে কাজ করে
- সব Account balance সঠিক থাকে
- Income, Expense ও Transfer সঠিকভাবে কাজ করে
- Receivable/Payable এবং partial repayment সঠিক থাকে
- transaction edit/delete করলে সব total সঠিক থাকে
- Dashboard, Budget ও Report একই হিসাব দেখায়
- Light ও Dark mode সব page-এ readable থাকে
- mobile ও desktop layout usable থাকে
- loading, empty, validation ও error state থাকে
- সব Phase typecheck pass করে
- এই plan-এর সব Phase `[x]` হয়
