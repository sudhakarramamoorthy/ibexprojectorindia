# Security Specification & Payload-First TDD — IbexProjectorsIndia

## 1. Data Invariants
1. **Strict Ownership & PII Isolation**: `/users/{userId}` holds user PII (`email`, `displayName`, `city`, onboarding preferences). Only the authenticated verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) may `get`, `create`, `update`, or `delete` their profile. Blanket `list` on `/users` is denied.
2. **Admin-Controlled Product & Pricing Database**: `/products/{productId}` stores public active projector specifications and INR marketplace pricing. Anyone may `get` a valid product ID or `list` active products (`status == 'active'`), while `create`, `update`, and `delete` are strictly restricted to the verified admin (`sudhakar.ramamoorthy@gmail.com`) with strict field and numeric validation.
3. **Master Gate Relational Sync**: Every subcollection document under `/users/{userId}/configurations/{configId}`, `/users/{userId}/priceWatches/{watchId}`, `/users/{userId}/cartItems/{itemId}`, and `/users/{userId}/chatMessages/{messageId}` requires the parent `/users/{userId}` document to exist on single-document `create`/`update` and enforces `incoming().userId == userId && userId == request.auth.uid`.
4. **Immutable Identity, Chat Logs & Timestamps**: `uid`, `id`, `userId`, and `createdAt` are immutable after creation; `createdAt == request.time` on `create` and `updatedAt == request.time` on `create` and `update`. Chat messages are append-only (`update: if false`) and owner-deletable.
5. **Volumetric & Type Safety**: All strings enforce explicit `.size()` limits synchronized with `firebase-blueprint.json`, IDs match `^[a-zA-Z0-9_\-]+$`, numeric bounds prevent negative throw ratios, prices, or excessive cart quantities, and `hasOnly` prevents ghost/shadow fields.

## 2. The "Dirty Dozen+" Adversarial Payloads
1. **Unauthenticated Profile Read**: `GET /users/alice` with `auth == null` -> `PERMISSION_DENIED`.
2. **Cross-User PII Leak**: `GET /users/alice` as `bob` -> `PERMISSION_DENIED`.
3. **Unverified Email Write**: `CREATE /users/alice` with `email_verified: false` -> `PERMISSION_DENIED`.
4. **Shadow Ghost Field Injection**: `CREATE /users/alice` including `{ isAdmin: true, role: "superadmin" }` -> `PERMISSION_DENIED`.
5. **Non-Admin Product Price Tampering**: `UPDATE /products/benq-x3100i` as a normal authenticated user -> `PERMISSION_DENIED`.
6. **Path ID Poisoning**: `CREATE /users/alice/configurations/../../../evil$id` (invalid chars or >128 chars) -> `PERMISSION_DENIED`.
7. **Identity Spoofing on Subcollection**: `CREATE /users/alice/chatMessages/m1` as `alice` with `{ userId: "bob" }` -> `PERMISSION_DENIED`.
8. **Client Timestamp Forgery**: `CREATE /users/alice/priceWatches/w1` with `createdAt` != `request.time` -> `PERMISSION_DENIED`.
9. **Immutable Field Tampering**: `UPDATE /users/alice/configurations/c1` changing `createdAt` or `userId`, or `UPDATE /users/alice/chatMessages/m1` -> `PERMISSION_DENIED`.
10. **Value Poisoning on Update**: `UPDATE /users/alice/priceWatches/w1` setting `targetPriceInr: -50000` or `notes` of 2000 chars -> `PERMISSION_DENIED`.
11. **Invalid Enum Injection**: `CREATE /users/alice/configurations/c1` with `indiaPower: "nuclear_grid"` or `/users/alice` with `budgetTier: "free"` -> `PERMISSION_DENIED`.
12. **Denial-of-Wallet Oversized String**: `CREATE /users/alice/chatMessages/m1` with `content` of 50,000 chars -> `PERMISSION_DENIED`.
13. **Blanket User List Scraping**: `LIST /users` as any signed-in user -> `PERMISSION_DENIED`.
