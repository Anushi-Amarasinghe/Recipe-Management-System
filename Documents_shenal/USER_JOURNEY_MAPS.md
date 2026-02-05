# User Journey Maps (Key Workflows)

This document provides journey maps for core user and admin workflows.

---

## 1) User Registration → Login → Create Recipe

```mermaid
flowchart LR
  A[Landing/Login Page] --> B[Register Account]
  B --> C[Registration Success + Token]
  C --> D[Login]
  D --> E[Dashboard Loads]
  E --> F[Add Recipe Page]
  F --> G[Fill Form + Upload Image]
  G --> H[Submit]
  H --> I[Recipe Created]
  I --> J[My Recipes View Updated]
```

---

## 2) User OTP Login

```mermaid
flowchart LR
  A[Login Page] --> B[Request OTP]
  B --> C[OTP Sent]
  C --> D[Enter OTP]
  D --> E[Verify OTP]
  E --> F[Dashboard Loads]
```

---

## 3) User Edit Recipe

```mermaid
flowchart LR
  A[My Recipes] --> B[Select Recipe]
  B --> C[Edit Recipe]
  C --> D[Update Fields]
  D --> E[Save]
  E --> F[Recipe Updated]
```

---

## 4) User Delete Recipe (Owner)

```mermaid
flowchart LR
  A[My Recipes] --> B[Delete Recipe]
  B --> C[Confirm]
  C --> D[Recipe Removed]
```

---

## 5) Admin Login → Dashboard

```mermaid
flowchart LR
  A[Admin Login Page] --> B[Enter Admin Credentials]
  B --> C{Admin Auth OK?}
  C -- No --> D[Error + Block Access]
  C -- Yes --> E[Admin Dashboard Loads]
```

---

## 6) Admin Manage Users (Deactivate + Soft Delete)

```mermaid
flowchart LR
  A[Admin Dashboard] --> B[Manage Users]
  B --> C[Search/Filter]
  C --> D[Deactivate User]
  D --> E[Status -> Suspended]
  E --> F[Soft Delete User]
  F --> G[Status -> Deleted]
```

---

## 7) Admin Manage Categories (CRUD)

```mermaid
flowchart LR
  A[Admin Dashboard] --> B[Manage Categories]
  B --> C[Add Category]
  C --> D[Category Listed]
  D --> E[Edit Category]
  E --> F[Category Updated]
  F --> G[Delete Category]
  G --> H[Category Removed]
```

---

## 8) Admin Manage Recipes (List + Soft/Hard Delete)

```mermaid
flowchart LR
  A[Admin Dashboard] --> B[Manage Recipes]
  B --> C[Filter/Search]
  C --> D[Select Recipe]
  D --> E[Delete (Soft/Hard)]
  E --> F[Recipe Removed or Marked Deleted]
```

---

## 9) Admin Insights (Analytics)

```mermaid
flowchart LR
  A[Admin Dashboard] --> B[Insights]
  B --> C[Overview Metrics]
  C --> D[Trend Charts]
  D --> E[Category + Tag Insights]
  E --> F[Auto Refresh]
```

