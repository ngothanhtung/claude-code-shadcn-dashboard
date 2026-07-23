---
kind: business_term
name: Business Glossary
category: business_term
scope:
  - "**"
---

### RLS

- Definition：Row-Level Security in this project refers to the dual-layer ownership model for customer records: client-side filtering by `userId` (the authenticated user's UID) combined with Firestore Security Rules that enforce read/write/delete only for the document owner or an admin role.
- Aliases：row-level security

### Yêu cầu tư vấn

- Definition：A lead-capture submission created through the public `/api/customers` POST endpoint; it creates a `customers` document with empty `userId` and triggers a Telegram notification to the sales team.

### Admin

- Definition：A user whose Firebase Auth token carries `roles` containing `'admin'`; such users bypass per-record ownership checks on `customers` and `users` collections as defined in the Firestore rules `isAdmin()` helper.
