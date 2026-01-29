# Sprint 2 – User Stories for Trello Board

Trello-style user stories (US1–US10) with tasks and story points, based on the Sprint 2 implementation.

---

## 1. Recipe Management: Add/Edit Recipe Form

| ID | User Story / Task | Story Points |
|----|-------------------|--------------|
| **US1-T.1** | Build Add/Edit Recipe form with core fields (title, description, category, rating, prep/cook time, servings, notes) | 5 |
| **US1-T.2** | Implement dynamic add/remove for ingredients (ingredient rows with add/remove buttons, min one required) | 3 |
| **US1-T.3** | Implement dynamic add/remove for instructions (instruction steps with add/remove, min one required) | 3 |
| **US1-T.4** | Implement star rating (1–5) with visual feedback and labels (Excellent, Very Good, Good, Fair, Poor) | 2 |
| **US1-T.5** | Add tags input (type + Enter to add, remove tags, persist to backend) | 2 |
| **US1-T.6** | Add dietary options (Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Keto, Low-Carb, Low-Calorie) as checkboxes | 2 |
| **US1-T.7** | Add difficulty levels (Easy, Medium, Hard) as radio buttons with default Medium | 1 |
| **US1-T.8** | Support Edit mode: load recipe by ID, pre-fill form, submit via PUT /api/recipes/:id | 3 |

---

## 2. Image Upload Handling

| ID | User Story / Task | Story Points |
|----|-------------------|--------------|
| **US2-T.1** | Implement drag-and-drop image upload zone and click-to-upload on Add/Edit Recipe form | 2 |
| **US2-T.2** | Add client-side file validation (type: image/*, max size 10MB) and user-facing error messages | 2 |
| **US2-T.3** | Add image preview before submit (thumbnail, optional remove) | 1 |
| **US2-T.4** | Configure backend storage: Multer disk storage, `/uploads`, 5MB limit, image mimetypes (jpeg, png, webp, gif) | 3 |
| **US2-T.5** | Integrate image upload with POST/PUT recipe endpoints (multipart/form-data, optional image) | 2 |

---

## 3. Duplicate Detection & Validation

| ID | User Story / Task | Story Points |
|----|-------------------|--------------|
| **US3-T.1** | Implement real-time duplicate recipe check on title input (debounced ~500ms, min 3 chars) | 3 |
| **US3-T.2** | Show duplicate warning UI (message + existing title) when duplicate detected; clear when title changes | 2 |
| **US3-T.3** | Add backend duplicate check on create (POST /api/recipes): case-insensitive, per-user, return 409 + duplicate flag | 3 |
| **US3-T.4** | Add backend duplicate check on update (PUT /api/recipes/:id): exclude current recipe, same rules as create | 2 |
| **US3-T.5** | Implement data sanitization: trim strings, filter empty ingredients/instructions/dietary/tags, validate difficulty enum | 2 |
| **US3-T.6** | Handle duplicate API errors in frontend (409, duplicate flag) with clear user message and optional retry | 1 |

---

## 4. Activity Feed: Real-Time Activity Tracking

| ID | User Story / Task | Story Points |
|----|-------------------|--------------|
| **US4-T.1** | Build Activity model (userId, userName, action, recipeId, recipeTitle, timestamps) and index on createdAt | 2 |
| **US4-T.2** | Log recipe created/updated/deleted in routes; create Activity records (non-blocking, with error handling) | 3 |
| **US4-T.3** | Implement GET /api/activities with optional `limit`; return recent activities, exclude password-like data | 2 |
| **US4-T.4** | Set up Socket.IO server, `activity-feed` room, and `emitActivity` helper; emit on create/update/delete | 3 |
| **US4-T.5** | Build Activity Feed UI component (dashboard widget): fetch activities, render list, relative timestamps | 3 |
| **US4-T.6** | Connect Activity Feed to Socket.IO: join room, listen for `new-activity`, update feed in real time | 2 |

---

## 5. Dashboard Updates

| ID | User Story / Task | Story Points |
|----|-------------------|--------------|
| **US5-T.1** | Integrate Activity Feed widget into dashboard (collapsible, live indicator) | 2 |
| **US5-T.2** | Add navigation to Add Recipe and Edit Recipe (from My Recipes, recipe cards, etc.) | 2 |
| **US5-T.3** | Improve dashboard navigation (Recipes, My Recipes, Favourites, Meal Planner, Settings) and active state | 2 |
| **US5-T.4** | Load user display name (e.g. from GET /api/auth/me) and show in header | 1 |
| **US5-T.5** | Wire dashboard search to recipe list and ensure consistent UX across views | 2 |

---

## 6. Backend API Enhancements

| ID | User Story / Task | Story Points |
|----|-------------------|--------------|
| **US6-T.1** | Implement GET /api/recipes (public list), GET /api/recipes/mine (auth), GET /api/recipes/:id (owner), POST /api/recipes, PUT /api/recipes/:id, DELETE /api/recipes/:id | 5 |
| **US6-T.2** | Implement admin endpoints: GET /api/recipes/admin/all, DELETE /api/recipes/admin/:id (admin-only) | 2 |
| **US6-T.3** | Build auth middleware (JWT verify, attach userId/role); protect recipe and activity routes | 3 |
| **US6-T.4** | Build admin login / role-checked flow (e.g. POST /api/auth/login + GET /api/auth/admin/me, admin-only) | 2 |
| **US6-T.5** | Add role middleware (adminOnly, userOrAdmin) and apply to routes per access rules | 2 |
| **US6-T.6** | Implement centralized error handler (sendError, ErrorCodes: VALIDATION_ERROR, AUTH_ERROR, NOT_FOUND, etc.) | 2 |
| **US6-T.7** | Add rate limiting and body size limits for auth routes; return PAYLOAD_TOO_LARGE / RATE_LIMIT_EXCEEDED | 2 |
| **US6-T.8** | Add validation middleware (e.g. express-validator) for register/login; use standardized error format | 2 |

---

## 7. UI/UX Enhancements

| ID | User Story / Task | Story Points |
|----|-------------------|--------------|
| **US7-T.1** | Apply modern styling to Add/Edit Recipe form (layout, typography, spacing, form controls) | 3 |
| **US7-T.2** | Add responsive layout for Add/Edit Recipe and Dashboard (mobile-friendly breakpoints) | 2 |
| **US7-T.3** | Add animations (e.g. slide-out on remove ingredient/instruction) and loading states for async actions | 2 |
| **US7-T.4** | Add visual feedback for success/error messages (toast or inline) and form validation errors | 2 |
| **US7-T.5** | Improve accessibility: aria-labels, form labels, focus management, keyboard-friendly controls | 2 |

---

## 8. Testing

| ID | User Story / Task | Story Points |
|----|-------------------|--------------|
| **US8-T.1** | Unit tests for Recipe, User, Activity models (validation, defaults, indexes) | 3 |
| **US8-T.2** | Unit tests for auth middleware (valid/invalid token, missing token) and role middleware (admin/user) | 2 |
| **US8-T.3** | Unit tests for validation middleware (register/login) and error handler (sendError, ErrorCodes) | 2 |
| **US8-T.4** | Route tests for POST/GET /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/admin/me | 3 |
| **US8-T.5** | Route tests for recipes CRUD (create, list, get, update, delete, duplicate detection, image upload) | 5 |
| **US8-T.6** | Route tests for GET /api/activities (with limit, auth) | 2 |
| **US8-T.7** | Integration/workflow tests: register → login → create recipe → update → delete, plus admin flows | 5 |
| **US8-T.8** | Validation-specific tests: duplicate detection (case, whitespace, per-user, update), image upload (type, size) | 3 |

---

## 9. UI/UX: Real-Time Validation on Register Page

| ID | User Story / Task | Story Points |
|----|-------------------|--------------|
| **US9-T.1** | Add real-time password requirements (length, upper, lower, number, special) with checkmarks/crosses | 2 |
| **US9-T.2** | Add password strength indicator (Weak / Medium / Strong) with visual bar and label | 2 |
| **US9-T.3** | Add real-time confirm-password match indicator (match / no match) with clear styling | 1 |
| **US9-T.4** | Ensure register form submit uses same validation rules and displays backend validation errors | 1 |

---

## 10. Bulk Operations & Trash (Optional)

| ID | User Story / Task | Story Points |
|----|-------------------|--------------|
| **US10-T.1** | Add `deletedAt` to Recipe model for soft-delete/trash; exclude soft-deleted from GET /api/recipes, /mine, /admin/all | 2 |
| **US10-T.2** | Implement POST /api/recipes/bulk-delete – body: `{ ids: [...] }`. Soft-delete multiple recipes. Owner-only (user: own; admin: any). Log activity per recipe | 3 |
| **US10-T.3** | Implement POST /api/recipes/bulk-restore – body: `{ ids: [...] }`. Restore multiple recipes from trash. Owner-only (user: own; admin: any) | 2 |
| **US10-T.4** | Implement GET /api/recipes/trash – list soft-deleted recipes (owner: own; admin: all) | 2 |
| **US10-T.5** | Implement POST /api/recipes/:id/restore – restore one recipe from trash (owner or admin) | 1 |
| **US10-T.6** | Treat soft-deleted recipes as not found in GET /api/recipes/:id and PUT /api/recipes/:id; exclude from duplicate-title checks | 1 |

---

## Summary by Epic

| Epic | Story IDs | Total Story Points |
|------|-----------|--------------------|
| Recipe Add/Edit Form | US1-T.1 – US1-T.8 | 21 |
| Image Upload | US2-T.1 – US2-T.5 | 10 |
| Duplicate Detection & Validation | US3-T.1 – US3-T.6 | 13 |
| Activity Feed Real-Time | US4-T.1 – US4-T.6 | 15 |
| Dashboard Updates | US5-T.1 – US5-T.5 | 9 |
| Backend API | US6-T.1 – US6-T.8 | 20 |
| UI/UX Enhancements | US7-T.1 – US7-T.5 | 11 |
| Testing | US8-T.1 – US8-T.8 | 25 |
| Register Page Real-Time Validation | US9-T.1 – US9-T.4 | 6 |
| Bulk Operations & Trash (Optional) | US10-T.1 – US10-T.6 | 11 |
| **Total** | | **141** |

---

## Copy-Paste Format for Trello (Full List)

Use one card per line. Paste each line as a Trello card title; add "Story points: X" in description or as a label.

**US1 – Recipe Add/Edit Form**
- US1-T.1 Build Add/Edit Recipe form with core fields (title, description, category, rating, prep/cook time, servings, notes) Story points: 5
- US1-T.2 Implement dynamic add/remove for ingredients (min one required) Story points: 3
- US1-T.3 Implement dynamic add/remove for instructions (min one required) Story points: 3
- US1-T.4 Implement star rating (1–5) with visual feedback and labels (Excellent, Very Good, Good, Fair, Poor) Story points: 2
- US1-T.5 Add tags input (type + Enter to add, remove tags, persist to backend) Story points: 2
- US1-T.6 Add dietary options as checkboxes (Vegetarian, Vegan, Gluten-Free, etc.) Story points: 2
- US1-T.7 Add difficulty levels (Easy, Medium, Hard) as radio buttons, default Medium Story points: 1
- US1-T.8 Support Edit mode: load recipe by ID, pre-fill form, submit via PUT /api/recipes/:id Story points: 3

**US2 – Image Upload**
- US2-T.1 Implement drag-and-drop and click-to-upload image zone on Add/Edit Recipe form Story points: 2
- US2-T.2 Add client-side file validation (type image/*, max 10MB) and error messages Story points: 2
- US2-T.3 Add image preview before submit (thumbnail, remove) Story points: 1
- US2-T.4 Configure backend storage: Multer disk storage, /uploads, 5MB limit, image mimetypes only Story points: 3
- US2-T.5 Integrate image upload with POST/PUT recipe endpoints (multipart/form-data) Story points: 2

**US3 – Duplicate Detection & Validation**
- US3-T.1 Implement real-time duplicate check on recipe title (debounced, min 3 chars) Story points: 3
- US3-T.2 Show duplicate warning UI when duplicate detected; clear when title changes Story points: 2
- US3-T.3 Backend duplicate check on create (POST /api/recipes): case-insensitive, per-user, 409 + duplicate flag Story points: 3
- US3-T.4 Backend duplicate check on update (PUT /api/recipes/:id): exclude current recipe Story points: 2
- US3-T.5 Data sanitization: trim, filter empty arrays, validate difficulty enum Story points: 2
- US3-T.6 Handle 409 duplicate errors in frontend with clear message Story points: 1

**US4 – Activity Feed Real-Time**
- US4-T.1 Build Activity model (userId, userName, action, recipeId, recipeTitle) and index on createdAt Story points: 2
- US4-T.2 Log recipe created/updated/deleted; create Activity records (non-blocking) Story points: 3
- US4-T.3 Implement GET /api/activities with optional limit Story points: 2
- US4-T.4 Set up Socket.IO server, activity-feed room, emitActivity; emit on create/update/delete Story points: 3
- US4-T.5 Build Activity Feed UI (dashboard widget): fetch, render list, relative timestamps Story points: 3
- US4-T.6 Connect Activity Feed to Socket.IO: join room, listen new-activity, update in real time Story points: 2

**US5 – Dashboard Updates**
- US5-T.1 Integrate Activity Feed widget into dashboard (collapsible, live indicator) Story points: 2
- US5-T.2 Add navigation to Add Recipe and Edit Recipe from My Recipes, cards, etc. Story points: 2
- US5-T.3 Improve dashboard nav (Recipes, My Recipes, Favourites, Meal Planner, Settings) and active state Story points: 2
- US5-T.4 Load user display name (GET /api/auth/me) and show in header Story points: 1
- US5-T.5 Wire dashboard search to recipe list for consistent UX Story points: 2

**US6 – Backend API**
- US6-T.1 Implement GET /api/recipes, GET /api/recipes/mine, GET /api/recipes/:id, POST, PUT, DELETE Story points: 5
- US6-T.2 Implement GET /api/recipes/admin/all, DELETE /api/recipes/admin/:id (admin-only) Story points: 2
- US6-T.3 Build auth middleware (JWT verify, userId/role); protect recipe and activity routes Story points: 3
- US6-T.4 Build admin login flow (POST /api/auth/login, GET /api/auth/admin/me, admin-only) Story points: 2
- US6-T.5 Add role middleware (adminOnly, userOrAdmin) and apply to routes Story points: 2
- US6-T.6 Implement centralized error handler (sendError, ErrorCodes) Story points: 2
- US6-T.7 Add rate limiting and body size limits for auth; PAYLOAD_TOO_LARGE, RATE_LIMIT_EXCEEDED Story points: 2
- US6-T.8 Add validation middleware (express-validator) for register/login; standardized error format Story points: 2

**US7 – UI/UX Enhancements**
- US7-T.1 Modern styling for Add/Edit Recipe form (layout, typography, spacing) Story points: 3
- US7-T.2 Responsive layout for Add/Edit Recipe and Dashboard Story points: 2
- US7-T.3 Animations (e.g. slide-out on remove) and loading states Story points: 2
- US7-T.4 Visual feedback for success/error and validation errors Story points: 2
- US7-T.5 Accessibility: aria-labels, form labels, focus, keyboard-friendly Story points: 2

**US8 – Testing**
- US8-T.1 Unit tests for Recipe, User, Activity models Story points: 3
- US8-T.2 Unit tests for auth and role middleware Story points: 2
- US8-T.3 Unit tests for validation middleware and error handler Story points: 2
- US8-T.4 Route tests for auth (register, login, me, admin/me) Story points: 3
- US8-T.5 Route tests for recipes CRUD, duplicate detection, image upload Story points: 5
- US8-T.6 Route tests for GET /api/activities Story points: 2
- US8-T.7 Integration tests: register → login → create → update → delete, admin flows Story points: 5
- US8-T.8 Validation tests: duplicate (case, whitespace, per-user, update), image (type, size) Story points: 3

**US9 – Register Page Real-Time Validation**
- US9-T.1 Real-time password requirements (length, upper, lower, number, special) with checkmarks/crosses Story points: 2
- US9-T.2 Password strength indicator (Weak/Medium/Strong) with bar and label Story points: 2
- US9-T.3 Real-time confirm-password match indicator Story points: 1
- US9-T.4 Register submit uses same validation; display backend validation errors Story points: 1

**US10 – Bulk Operations & Trash (Optional)**
- US10-T.1 Add deletedAt to Recipe model for soft-delete/trash; exclude soft-deleted from GET /api/recipes, /mine, /admin/all Story points: 2
- US10-T.2 Implement POST /api/recipes/bulk-delete – body { ids: [...] }; soft-delete multiple recipes; owner-only + admin; log activity Story points: 3
- US10-T.3 Implement POST /api/recipes/bulk-restore – body { ids: [...] }; restore multiple from trash; owner-only + admin Story points: 2
- US10-T.4 Implement GET /api/recipes/trash – list soft-deleted recipes (owner: own; admin: all) Story points: 2
- US10-T.5 Implement POST /api/recipes/:id/restore – restore one recipe from trash (owner or admin) Story points: 1
- US10-T.6 Treat soft-deleted as not found in GET/PUT /api/recipes/:id; exclude from duplicate-title checks Story points: 1

---

*Generated from Sprint 2 implementation (Recipe Management System).*
