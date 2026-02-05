# Admin Design Diagrams

This document contains all requested design diagrams (Architecture, ERD, Admin Flow, and Sequence).

---

## 1) System Architecture (Frontend ↔ Backend ↔ DB)

```mermaid
flowchart LR
  subgraph Client
    A[Admin Dashboard UI\nHTML/CSS/JS]
  end

  subgraph Server
    B[Express API\nAuth + Admin Routes]
    C[Middleware\nJWT + Role]
  end

  subgraph Data
    D[(MongoDB)]
  end

  A -->|HTTPS/JSON| B
  B --> C
  C --> B
  B -->|Mongoose Models| D
```

---

## 2) ERD (User/Recipe/Category/AdminAudit)

```mermaid
erDiagram
  USER {
    ObjectId _id
    string f_name
    string l_name
    string email
    string password
    string role
    number active
    date created_date
    date deletedAt
  }

  RECIPE {
    ObjectId _id
    ObjectId userId
    string title
    string desc
    string category
    number rating
    date deletedAt
    ObjectId deletedBy
  }

  CATEGORY {
    ObjectId _id
    string name
    string slug
    string description
    boolean isActive
    ObjectId createdBy
    ObjectId updatedBy
  }

  ADMIN_AUDIT {
    ObjectId _id
    ObjectId actorId
    string action
    string targetType
    ObjectId targetId
    date createdAt
  }

  USER ||--o{ RECIPE : creates
  USER ||--o{ CATEGORY : manages
  USER ||--o{ ADMIN_AUDIT : performs
```

---

## 3) Admin Flow (Login → Dashboard → CRUD)

```mermaid
flowchart TD
  A[Admin Login] --> B{Admin Auth OK?}
  B -- No --> C[Show Error / Redirect]
  B -- Yes --> D[Admin Dashboard]
  D --> E[Users]
  D --> F[Categories]
  D --> G[Recipes]
  D --> H[Insights]
  E --> E1[Search/Filter]
  E --> E2[Deactivate/Activate]
  E --> E3[Soft/Hard Delete]
  F --> F1[List/Add/Edit/Delete]
  G --> G1[List/Filter]
  G --> G2[Soft/Hard Delete]
  H --> H1[Metrics + Charts]
```

---

## 4) Sequence Diagram (Admin Deletes User - Soft Delete)

```mermaid
sequenceDiagram
  participant Admin as Admin UI
  participant API as Express API
  participant Auth as Auth Middleware
  participant DB as MongoDB
  participant Audit as AdminAudit

  Admin->>API: DELETE /api/users/admin/:id?hard=false
  API->>Auth: verify JWT + role
  Auth-->>API: ok (admin)
  API->>DB: find User by id
  DB-->>API: User
  API->>DB: set deletedAt, deletedBy, active=0
  API->>Audit: create AdminAudit log
  API-->>Admin: 200 User soft deleted
```

---

## 5) Sequence Diagram (Admin Deletes Recipe - Hard Delete)

```mermaid
sequenceDiagram
  participant Admin as Admin UI
  participant API as Express API
  participant Auth as Auth Middleware
  participant DB as MongoDB
  participant Audit as AdminAudit

  Admin->>API: DELETE /api/recipes/admin/:id?mode=hard
  API->>Auth: verify JWT + role
  Auth-->>API: ok (admin)
  API->>DB: find Recipe by id
  DB-->>API: Recipe
  API->>DB: delete Recipe
  API->>Audit: create AdminAudit log
  API-->>Admin: 200 Recipe deleted
```

