# Money Management App — Product Plan

## ১. অ্যাপটির মূল উদ্দেশ্য

এই অ্যাপের লক্ষ্য হলো একজন ব্যবহারকারীর সব ধরনের টাকার হিসাব এক জায়গায় রাখা। যেমন:

- ব্যাংক অ্যাকাউন্টে কত টাকা আছে
- হাতে বা ওয়ালেটে কত নগদ টাকা আছে
- মোবাইল ব্যাংকিংয়ে কত টাকা আছে
- কে কত টাকা ধার নিয়েছে বা কাকে কত টাকা দিতে হবে
- বাবা বা অন্য কারও কাছ থেকে কত টাকা এসেছে
- কোন খাতে কত টাকা খরচ হয়েছে
- মাস শেষে টাকা কোথায় গেল এবং কত টাকা বাকি আছে

অ্যাপটির সবচেয়ে গুরুত্বপূর্ণ নিয়ম হবে: **প্রতিটি টাকা কোথা থেকে এলো, কোথায় গেল এবং এখন কোথায় আছে—এই তিনটি প্রশ্নের উত্তর সহজে পাওয়া।**

## ২. ব্যবহারকারীর টাকার জায়গা বা Account

ব্যবহারকারী প্রথমে তার টাকা রাখার জায়গাগুলো তৈরি করবে। উদাহরণ:

- Cash
- Bank Account
- bKash
- Nagad
- Rocket
- Savings Account
- অন্য কোনো Wallet বা Account

প্রতিটি Account-এ বর্তমান Balance দেখা যাবে। সব Account-এর Balance যোগ করে মোট নিজের টাকা দেখানো হবে।

এক Account থেকে অন্য Account-এ টাকা নিলে সেটি আয় বা খরচ হবে না। উদাহরণ: Bank থেকে ২,০০০ টাকা তুলে Cash-এ রাখলে Bank কমবে এবং Cash বাড়বে, কিন্তু মোট টাকা একই থাকবে। এটিকে **Transfer** বলা হবে।

## ৩. টাকার প্রধান কার্যক্রম

অ্যাপে চার ধরনের প্রধান লেনদেন থাকবে:

### Income

নিজের টাকা বেড়েছে এমন লেনদেন। উদাহরণ:

- বাবা টাকা পাঠিয়েছেন
- Salary
- Freelancing income
- Bonus
- Gift
- Business income
- অন্য কোনো আয়

“বাবা টাকা পাঠিয়েছেন” আলাদা Income Category হিসেবে রাখা যাবে। এতে মাসে বা বছরে বাবার কাছ থেকে মোট কত টাকা এসেছে তা দেখা যাবে।

### Expense

নিজের টাকা খরচ হয়েছে এমন লেনদেন। সম্ভাব্য Category:

- যাতায়াত
- Restaurant ও বাইরে খাওয়া
- বাজার ও Groceries
- বাসা ভাড়া
- বিদ্যুৎ
- গ্যাস
- পানি
- Internet ও Wi-Fi
- Mobile recharge
- চিকিৎসা ও ওষুধ
- শিক্ষা ও Course
- Shopping
- বিনোদন
- Subscription
- পরিবারকে দেওয়া
- দান
- ব্যক্তিগত যত্ন
- ভ্রমণ
- জরুরি খরচ
- অন্যান্য

প্রয়োজনে ব্যবহারকারী নিজের Category তৈরি করতে পারবে। Category-এর সঙ্গে ছোট Icon ও Color রাখা যাবে, যাতে রিপোর্ট সহজে বোঝা যায়।

### Transfer

নিজের এক Account থেকে অন্য Account-এ টাকা সরানো। উদাহরণ:

- Bank থেকে Cash withdrawal
- Cash থেকে Bank deposit
- Bank থেকে bKash-এ টাকা নেওয়া

Transfer-এর সময় কোনো Fee লাগলে Fee-টি আলাদা Expense হিসেবে যোগ করা যাবে।

### Loan বা ধার

ধারের হিসাব সাধারণ Income/Expense থেকে আলাদা থাকবে। দুই ধরনের ধার থাকবে:

- **Receivable:** আমি কাউকে টাকা দিয়েছি; তার কাছ থেকে টাকা ফেরত পাব।
- **Payable:** আমি কারও কাছ থেকে টাকা নিয়েছি; তাকে টাকা ফেরত দেব।

প্রতিটি ধারে থাকবে:

- ব্যক্তির নাম
- মোবাইল নম্বর বা ছোট পরিচয় (ঐচ্ছিক)
- মোট টাকার পরিমাণ
- কোন Account থেকে দেওয়া বা কোন Account-এ নেওয়া হয়েছে
- দেওয়ার/নেওয়ার তারিখ
- ফেরতের সম্ভাব্য তারিখ
- নোট
- আংশিক পরিশোধের ইতিহাস
- বর্তমান বাকি টাকা
- অবস্থা: চলমান, আংশিক পরিশোধ, সম্পূর্ণ পরিশোধ, overdue

কাউকে ধার দিলে Account Balance কমবে, কিন্তু সেটিকে সাধারণ খরচ হিসেবে দেখানো হবে না। টাকা ফেরত এলে Account Balance বাড়বে, কিন্তু সেটি নতুন আয় হিসেবে গণনা হবে না।

## ৪. ব্যবহারকারীর মূল Flow

### প্রথমবার অ্যাপ ব্যবহার

1. ব্যবহারকারী অ্যাপে প্রবেশ করবে।
2. নিজের প্রয়োজনীয় Account তৈরি করবে।
3. প্রতিটি Account-এর বর্তমান Balance লিখবে।
4. সাধারণ Income ও Expense Category আগে থেকেই থাকবে।
5. চাইলে নিজের Category যোগ বা অপ্রয়োজনীয় Category লুকাতে পারবে।
6. এরপর Dashboard-এ নিজের সম্পূর্ণ আর্থিক অবস্থা দেখবে।

### প্রতিদিনের ব্যবহার

1. Dashboard থেকে বড় `Add Transaction` button চাপবে।
2. Income, Expense, Transfer অথবা Loan নির্বাচন করবে।
3. Amount লিখবে।
4. Account এবং Category/Person নির্বাচন করবে।
5. Date ও প্রয়োজন হলে Note লিখবে।
6. Save করার সঙ্গে সঙ্গে সংশ্লিষ্ট Balance এবং Dashboard আপডেট হবে।

দ্রুত entry দেওয়ার জন্য Amount, Account ও Category হবে প্রধান field; অন্য fieldগুলো optional থাকবে। সর্বশেষ ব্যবহৃত Account মনে রাখা যেতে পারে।

## ৫. Dashboard

Dashboard খুললেই ব্যবহারকারী দেখবে:

- সব Account মিলিয়ে মোট বর্তমান টাকা
- Cash Balance
- Bank/Mobile Banking Balance
- এই মাসের মোট Income
- এই মাসের মোট Expense
- এই মাসে হাতে থাকা Net Amount
- অন্যদের কাছ থেকে মোট পাওনা
- অন্যদের মোট দেনা
- overdue ধার
- সাম্প্রতিক লেনদেন
- সবচেয়ে বেশি খরচ হওয়া Category
- মাসিক Budget-এর কতটুকু ব্যবহার হয়েছে

Dashboard-এ Balance লুকানোর একটি option থাকবে, যাতে অন্য কারও সামনে অ্যাপ খুললে টাকার পরিমাণ দেখা না যায়।

## ৬. Transaction History

সব লেনদেন একটি পরিষ্কার Timeline/List-এ থাকবে। ব্যবহারকারী Filter করতে পারবে:

- তারিখ অনুযায়ী
- Income বা Expense অনুযায়ী
- Account অনুযায়ী
- Category অনুযায়ী
- Amount range অনুযায়ী
- Person বা Loan অনুযায়ী

ভুল entry Edit বা Delete করা যাবে। Delete করার আগে confirmation দেখাতে হবে, কারণ এটি Balance পরিবর্তন করবে। Search ব্যবহার করে Note বা Person-এর নামও খোঁজা যাবে।

## ৭. ধার ব্যবস্থাপনার আলাদা Flow

Loan section-এ দুটি Tab থাকবে:

- পাবো
- দেবো

প্রতিটি ব্যক্তির Card-এ মোট টাকা, পরিশোধ করা টাকা, বাকি টাকা এবং due date দেখা যাবে। আংশিক টাকা ফেরত দিলে `Add Repayment` থেকে Amount ও কোন Account-এ টাকা এসেছে/গেছে তা নির্বাচন করা হবে।

Due date কাছাকাছি এলে Reminder দেখানো হবে। প্রথম সংস্করণে app-এর ভেতরে reminder রাখা যাবে; পরবর্তী সংস্করণে notification যোগ করা যাবে।

একই ব্যক্তির সঙ্গে একাধিক ধার থাকলে আলাদা Loan রাখা যাবে, আবার Person-এর profile-এ সবগুলোর মোট হিসাবও দেখা যাবে।

## ৮. Budget বা খরচের সীমা

ব্যবহারকারী মাসিক মোট Budget অথবা Category ভিত্তিক Budget সেট করতে পারবে। উদাহরণ:

- Restaurant: ৩,০০০ টাকা
- যাতায়াত: ২,৫০০ টাকা
- Shopping: ৪,০০০ টাকা

প্রতিটি Budget-এ progress দেখা যাবে। ৮০% খরচ হলে সতর্কতা এবং সীমা পার হলে আলাদা warning দেখানো হবে। Budget না বানালেও অ্যাপের অন্যান্য feature ব্যবহার করা যাবে।

## ৯. Report ও Insight

Report page-এ দেখা যাবে:

- দৈনিক, সাপ্তাহিক, মাসিক ও বার্ষিক Income বনাম Expense
- Category অনুযায়ী খরচ
- কোন Account থেকে বেশি খরচ হয়েছে
- আগের মাসের তুলনায় খরচ বেড়েছে না কমেছে
- নিয়মিত বা বারবার হওয়া খরচ
- সবচেয়ে বড় কয়েকটি খরচ
- Income source অনুযায়ী মোট আয়
- বাবা কত টাকা পাঠিয়েছেন—আলাদা হিসাব
- ধার দেওয়া, ফেরত পাওয়া এবং বাকি টাকার summary

Insight সহজ ভাষায় হবে। যেমন: “গত মাসের তুলনায় Restaurant-এ ১,২০০ টাকা বেশি খরচ হয়েছে।”

## ১০. নিয়মিত লেনদেন

পরবর্তী ধাপে Recurring Transaction রাখা যেতে পারে। যেমন:

- মাসিক বাসা ভাড়া
- Internet bill
- Subscription
- নিয়মিত allowance বা salary

নির্ধারিত তারিখে অ্যাপ entry দেওয়ার reminder করবে। ব্যবহারকারীর নিশ্চিতকরণ ছাড়া সরাসরি Balance পরিবর্তন না করাই নিরাপদ।

## ১১. প্রয়োজনীয় Page ও Component

প্রধান Page:

- Dashboard
- Transactions
- Add/Edit Transaction
- Accounts
- Loans
- Budgets
- Reports
- Categories
- Settings

বারবার ব্যবহৃত interface অংশগুলো reusable হবে। যেমন:

- Account card
- Balance summary card
- Transaction item
- Category badge
- Amount input
- Account selector
- Category selector
- Date picker
- Loan card
- Budget progress
- Filter panel
- Empty state
- Confirmation dialog
- Theme control

## ১২. গুরুত্বপূর্ণ হিসাবের নিয়ম

- Income হলে নির্বাচিত Account-এর Balance বাড়বে।
- Expense হলে নির্বাচিত Account-এর Balance কমবে।
- Transfer হলে Source Account কমবে এবং Destination Account বাড়বে।
- কাউকে ধার দিলে Account কমবে এবং Receivable বাড়বে; Expense বাড়বে না।
- ধার ফেরত পেলে Account বাড়বে এবং Receivable কমবে; Income বাড়বে না।
- কারও কাছ থেকে ধার নিলে Account বাড়বে এবং Payable বাড়বে; Income বাড়বে না।
- ধার পরিশোধ করলে Account কমবে এবং Payable কমবে; Expense বাড়বে না।
- Opening Balance কোনো মাসের Income হিসেবে গণনা হবে না।
- Edit/Delete করলে সংশ্লিষ্ট সব Balance সঠিকভাবে আবার হিসাব করতে হবে।
- ভবিষ্যতের তারিখের entry আলাদাভাবে Scheduled হিসেবে দেখানো উচিত; তারিখ আসার আগে Balance-এ যোগ না করাই ভালো।

## ১৩. প্রথম Version-এ যা থাকবে

প্রথম usable version ছোট কিন্তু সম্পূর্ণ হবে:

1. Account তৈরি এবং Opening Balance
2. Income ও Expense যোগ করা
3. Account-to-Account Transfer
4. ধার দেওয়া, ধার নেওয়া ও Repayment
5. Transaction list, search ও filter
6. Basic Dashboard
7. Category management
8. Monthly ও Category Budget
9. Basic monthly report
10. Light/Dark/System theme

## ১৪. পরবর্তী Version-এর সম্ভাব্য Feature

- Recurring transaction reminder
- Notification
- Receipt image attachment
- CSV/PDF export
- Data backup ও restore
- একাধিক currency
- Family/shared wallet
- Savings goal
- Installment tracking
- Bank statement import
- PIN/biometric lock

## ১৫. App তৈরির ধাপ

### Phase 1 — Foundation

- App-এর navigation ও page layout ঠিক করা
- Account, Category এবং opening balance flow তৈরি করা
- প্রয়োজনীয় default Category প্রস্তুত করা

### Phase 2 — Core Money Flow

- Income, Expense ও Transfer flow তৈরি করা
- Transaction history, filter, edit ও delete তৈরি করা
- সব Balance-এর হিসাব যাচাই করা

### Phase 3 — Loan Management

- Receivable ও Payable flow তৈরি করা
- Partial repayment ও due status তৈরি করা
- Person ভিত্তিক ধার summary তৈরি করা

### Phase 4 — Planning and Reports

- Budget তৈরি করা
- Dashboard summary ও warning তৈরি করা
- Monthly report এবং category insight তৈরি করা

### Phase 5 — Polish

- Empty, loading ও error state ঠিক করা
- Mobile usability এবং accessibility পরীক্ষা করা
- গুরুত্বপূর্ণ action-এর confirmation ও validation যোগ করা
- হিসাবের edge case পরীক্ষা করা

## ১৬. বর্তমানে নেওয়া Product Decision

- App-টি প্রথমে একজন ব্যবহারকারীর ব্যক্তিগত ব্যবহারের জন্য হবে।
- Cash, Bank এবং Mobile Banking আলাদা Account হিসেবে থাকবে।
- বাবার পাঠানো টাকা Income-এর একটি আলাদা source/category হবে।
- ধার Income/Expense নয়; আলাদা Receivable/Payable হিসেবে হিসাব হবে।
- Transfer মোট আয় বা খরচ পরিবর্তন করবে না।
- দ্রুত transaction entry এবং সঠিক balance—দুটিকে সবচেয়ে বেশি গুরুত্ব দেওয়া হবে।

## ১৭. পরবর্তী Planning-এ যা নির্ধারণ করা হবে

আপনি `nextplan` বললে এই একই document আপডেট করে নিচের বিষয়গুলো চূড়ান্ত করা হবে:

- প্রতিটি Page-এর বিস্তারিত screen layout
- Navigation এবং mobile user flow
- প্রতিটি form-এর field ও validation
- Dashboard card এবং report-এর নির্দিষ্ট বিন্যাস
- Loan ও repayment-এর edge case
- প্রথম version-এর exact implementation checklist

