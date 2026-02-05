# Admin Testing Guide

This document covers the testing strategy for the admin capabilities that were implemented (users, categories, recipes, analytics, and dashboard UI).

## 1) Unit Tests (Frontend logic)

### AdminChartUtils (Mocha + Chai)
File: `backend/test/frontend/adminChartUtils.test.js`

| Test | Input | Expected Result |
|------|-------|-----------------|
| buildTrendSeries | array of `{ date, total }` | returns `{ labels, values }` in matching order |
| buildRatingBuckets | buckets with `_id` 0..5 | returns labels `0-1...5+` and totals mapped per bucket |
| buildRoleBreakdown | roles array | returns labels list and totals list |

Run:
```
cd backend
npm test
```

## 2) API Tests (Admin endpoints)

File: `backend/test/routes/admin.test.js`

Covered:
- Admin login + admin/me
- Admin list users (RBAC enforced)
- Admin deactivate user + soft delete user
- Admin list recipes + soft delete recipe
- Category CRUD (admin only)
- Analytics overview metrics

Run:
```
cd backend
npm test
```

## 3) Integration Tests (Admin UI workflows)

### Playwright (Cross‑browser)
Files:
- `backend/playwright.config.js`
- `backend/frontend-tests/admin.spec.js`

#### Test Cases (Automated)
1. **Admin Login**
   - Steps: Open `/admin-login.html` → enter admin credentials → submit.
   - Expected: Redirect to `/admin-dashboard.html`, "Admin Panel" visible.

2. **Users Table**
   - Steps: Open dashboard.
   - Expected: "Manage Users" loaded, `#usersTableWrap` visible.

3. **Categories Table**
   - Steps: Click "Manage Categories".
   - Expected: `#categoriesTableWrap` visible.

4. **Recipes Table**
   - Steps: Click "Manage Recipes".
   - Expected: `#recipesTableWrap` visible.

5. **Analytics Charts**
   - Steps: Click "Insights".
   - Expected: User and recipe trend charts render.

Run:
```
cd backend
npm install
npx playwright install
npm run test:frontend
```

Notes:
- Requires backend server running at `http://localhost:5000`.
- Use `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars for login override.

## 4) Cross‑Browser Coverage

Playwright runs on:
- Chromium (Chrome)
- Firefox
- WebKit (Safari)

Each project executes the admin UI flows above.

## 5) Admin Feature Test Cases (Manual)

This section documents **all admin capabilities** with explicit test cases and expected results for manual testing.

### 4.1 Authentication & Access Control
- **Admin login success**
  - Steps: Login via `/admin-login.html` with valid admin credentials.
  - Expected: Redirect to `/admin-dashboard.html`, admin UI visible.
- **Admin login rejected for non‑admin**
  - Steps: Login with regular user credentials on admin login.
  - Expected: 403 response, user redirected to login or blocked.
- **Admin session protection**
  - Steps: Clear token and open `/admin-dashboard.html`.
  - Expected: Redirect to admin login page.

### 4.2 User Management
- **List users (pagination/search)**
  - Steps: Load Manage Users → search by name/email → paginate.
  - Expected: Results filtered; pagination metadata updates.
- **Deactivate user**
  - Steps: Click Deactivate → confirm.
  - Expected: Status becomes Suspended; user cannot log in.
- **Activate user**
  - Steps: Click Activate → confirm.
  - Expected: Status becomes Active; user can log in.
- **Soft delete user**
  - Steps: Delete → choose Soft → confirm.
  - Expected: Status becomes Deleted; user cannot log in.
- **Hard delete user with related data**
  - Steps: Delete → choose Hard for user with recipes/comments.
  - Expected: 409 validation error, deletion blocked.
- **Self‑protection**
  - Steps: Attempt to deactivate/delete your own admin account.
  - Expected: Operation rejected with validation error.
- **Admin‑protection**
  - Steps: Attempt to deactivate/delete another admin.
  - Expected: Operation rejected with 403.
- **Bulk deactivate**
  - Steps: Select multiple users → Bulk Deactivate → confirm.
  - Expected: Users become Suspended; protected users are skipped.
- **Bulk delete**
  - Steps: Select multiple users → Bulk Delete (soft/hard).
  - Expected: Soft delete applies; hard delete skips users with data; skipped reasons returned.

### 4.3 Category Management
- **Create category**
  - Steps: Add new category (name, description, status).
  - Expected: Category appears immediately in list.
- **Update category**
  - Steps: Edit category name/description/status.
  - Expected: List updates; recipe category values update on rename.
- **Delete unused category**
  - Steps: Delete category not used by any recipe.
  - Expected: Category removed successfully.
- **Delete category in use**
  - Steps: Delete category with active recipes.
  - Expected: 409 validation error; category remains.

### 4.4 Recipe Management
- **List recipes (pagination/filtering/search)**
  - Steps: Filter by category/status; search by title/desc/tags.
  - Expected: Results filtered; metadata correct.
- **Delete recipe (soft)**
  - Steps: Delete recipe with mode=soft.
  - Expected: Recipe marked deleted; disappears from active list.
- **Delete recipe (hard)**
  - Steps: Delete recipe with mode=hard.
  - Expected: Recipe removed permanently.
- **Bulk delete recipes**
  - Steps: Select multiple recipes → Bulk Delete (soft/hard).
  - Expected: Recipes removed/soft deleted; skipped list returned for invalid IDs.

### 4.5 Analytics & Insights
- **Overview metrics**
  - Steps: Open Insights.
  - Expected: Totals and growth percentages render.
- **Trend charts**
  - Steps: Change date range (7/30/90 days).
  - Expected: User/recipe trend charts update dynamically.
- **Rating buckets**
  - Steps: View rating distribution chart.
  - Expected: Buckets show recipe counts in each range.
- **Role breakdown**
  - Steps: View role breakdown chart.
  - Expected: Bars for admin/user counts.
- **Category usage + Tag insights**
  - Steps: View tables.
  - Expected: Top categories/tags sorted by usage.

### 4.6 Audit Trails
- **Admin actions logged**
  - Steps: Perform category/user/recipe actions.
  - Expected: `AdminAudit` entries created with actor/action/target.

## 6) Manual Verification Checklist (Quick)

- Admin login works and enforces role.
- Users list, filters, bulk ops, protections.
- Category CRUD with constraints.
- Recipe list, filters, soft/hard delete, bulk delete.
- Insights charts update with data changes.
- Audit trail records actions.

