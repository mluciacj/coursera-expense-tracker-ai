# Password Reset — Implementation Spec

> **Status:** Planned / Not yet implemented.
> This document describes the design for adding a password-reset flow to the Expense Tracker. As of writing, the application has no authentication layer; implementing this feature requires introducing user accounts, server-side API routes, and email delivery.

**User guide:** [../user/how-to-password-reset.md](../user/how-to-password-reset.md)

---

## Overview

The password-reset feature allows a registered user who has forgotten their password to receive a time-limited, single-use email link that lets them set a new password without contacting support.

---

## Scope and Non-Goals

**In scope:**
- Forgot-password form (user enters email address)
- Secure token generation and storage (server-side)
- Transactional email containing a reset link
- Reset-password form (user enters + confirms new password)
- Token validation: expiry, single-use, tamper detection
- Immediate session invalidation of the old password

**Out of scope (for this iteration):**
- Magic-link login (separate feature)
- SMS / phone-based reset
- Admin-initiated forced password reset
- OAuth / social login (no local password involved)
- Multi-factor authentication

---

## Feature Type

**Full-stack.** Reasoning:

- **Frontend** — two new pages (`/auth/forgot-password`, `/auth/reset-password`) and form components.
- **Backend** — two new Next.js API Route Handlers, a persistence layer for users and reset tokens, and an email-delivery integration.
- Currently the app is purely client-side (localStorage, no server). This feature requires introducing a database and email service for the first time.

---

## Architecture / Flow

### 1. Request reset (forgot-password)

```
User fills email  →  POST /api/auth/forgot-password
                          │
                    Lookup user by email
                    (no-op if not found — avoid user enumeration)
                          │
                    Generate cryptographically random token (32 bytes)
                    Hash token with SHA-256 before storing
                    Persist { userId, tokenHash, expiresAt (15 min) }
                          │
                    Send email with link:
                    /auth/reset-password?token=<raw_token>
                          │
                    Return 200 OK (always, regardless of email existence)
```

### 2. Validate token (reset-password page load)

```
User clicks link  →  GET /api/auth/reset-password/validate?token=<raw>
                          │
                    Hash incoming token, lookup tokenHash
                    Check: exists, not expired, not used
                          │
                    200 OK (valid) or 400/410 (invalid/expired)
```

### 3. Submit new password (reset-password)

```
User submits form  →  POST /api/auth/reset-password
                           │
                     Hash incoming token, lookup tokenHash
                     Re-validate (race-condition safe)
                           │
                     Hash new password (bcrypt, cost ≥ 12)
                     Update users.passwordHash
                     Mark token as used (or delete row)
                     Invalidate all active sessions for this user
                           │
                     Return 200 OK → redirect to /auth/login
```

---

## API Endpoints

### `POST /api/auth/forgot-password`

**Request body:**
```json
{ "email": "user@example.com" }
```

**Responses:**

| Status | Meaning |
|--------|---------|
| 200 | Always returned (prevents email enumeration) |
| 422 | Malformed email format |
| 429 | Rate limit exceeded (5 requests / 15 min per IP) |

---

### `GET /api/auth/reset-password/validate`

**Query params:** `?token=<raw_token>`

**Responses:**

| Status | Meaning |
|--------|---------|
| 200 | Token valid, client may render the new-password form |
| 400 | Token missing or malformed |
| 410 | Token expired or already used |

---

### `POST /api/auth/reset-password`

**Request body:**
```json
{
  "token": "<raw_token>",
  "password": "NewSecureP@ss1",
  "confirmPassword": "NewSecureP@ss1"
}
```

**Validation rules:**
- `password` ≥ 8 characters, at least one letter and one digit
- `password === confirmPassword`

**Responses:**

| Status | Meaning |
|--------|---------|
| 200 | Password updated successfully |
| 400 | Validation errors (details in `errors` array) |
| 410 | Token expired or already used |
| 422 | Password does not meet complexity rules |

---

## Data Model / Migrations

> Assumes a relational DB (e.g. PostgreSQL via Prisma). Adjust accordingly if using another store.

### New table: `users`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### New table: `password_reset_tokens`

```sql
CREATE TABLE password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,   -- SHA-256 of the raw token
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,            -- NULL = unused
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON password_reset_tokens(token_hash);
CREATE INDEX ON password_reset_tokens(user_id);
```

**Migration order:**
1. `create_users`
2. `create_password_reset_tokens`

---

## Key Modules / Files

| File (to create) | Purpose |
|------------------|---------|
| `app/auth/forgot-password/page.tsx` | Forgot-password UI page |
| `app/auth/reset-password/page.tsx` | Reset-password UI page (reads `?token` from URL) |
| `app/api/auth/forgot-password/route.ts` | POST handler — generate + email token |
| `app/api/auth/reset-password/validate/route.ts` | GET handler — token validity check |
| `app/api/auth/reset-password/route.ts` | POST handler — apply new password |
| `components/forms/ForgotPasswordForm.tsx` | Email input form component |
| `components/forms/ResetPasswordForm.tsx` | New-password + confirm form component |
| `lib/auth/token.ts` | `generateResetToken()`, `hashToken()` utilities |
| `lib/auth/password.ts` | `hashPassword()`, `verifyPassword()` (bcrypt wrappers) |
| `lib/email.ts` | `sendPasswordResetEmail()` using chosen provider |
| `lib/db.ts` | Prisma client singleton (new) |

---

## Edge Cases and Failure Modes

| Scenario | Handling |
|----------|---------|
| Email not registered | Silent 200 — no email sent, no error exposed |
| Token expired | 410 response; user must request a new link |
| Token already used | 410 response; same UX as expired |
| User requests multiple resets | Each new request invalidates previous unused tokens for that user |
| DB down during token generation | 500; do not send email if token was not persisted |
| Email delivery failure | Log + return 500; do not silently succeed |
| Password same as current | Optionally reject (UX choice); otherwise allow |
| Concurrent submissions (race) | Re-validate token atomically in a DB transaction |

---

## Security / Permissions Considerations

- **Token entropy:** 32 cryptographically random bytes (256 bits) — resistant to brute force.
- **Server-side hash:** Only the SHA-256 hash of the token is stored; raw token exists only in the email link and in transit.
- **Expiry:** 15-minute window limits exposure if email is compromised.
- **Single-use:** Mark token as `used_at` (or delete) immediately on consumption, inside the same DB transaction as the password update.
- **Session invalidation:** All existing sessions for the user must be revoked after a successful reset.
- **Rate limiting:** 5 requests per 15 minutes per IP on the forgot-password endpoint to prevent abuse.
- **No user enumeration:** Always return 200 from `POST /api/auth/forgot-password` regardless of whether the email exists.
- **HTTPS only:** Reset links must be served over HTTPS in production.
- **CSRF:** API Route Handlers should validate `Origin` / use SameSite cookies.

---

## Observability

| Event | How to observe |
|-------|---------------|
| Reset requested | Server log: `[password-reset] token generated userId=<id>` |
| Email sent | Server log: `[email] reset email dispatched to <masked_email>` |
| Email delivery failure | Error log + optional alert |
| Token validated | Server log: `[password-reset] token validated userId=<id>` |
| Password updated | Server log: `[password-reset] password changed userId=<id>` |
| Token expired/used | Server log: `[password-reset] rejected token (expired|used)` |
| Rate limit hit | Server log + HTTP 429 |

Recommended: add a `password_reset_events` audit trail if compliance is required.

---

## Tests to Add

| Test | Type | Location |
|------|------|----------|
| Successful forgot → email dispatched | Integration | `__tests__/api/auth/forgot-password.test.ts` |
| Unknown email → still 200, no email | Integration | same |
| Token validation: valid, expired, used | Unit | `__tests__/lib/auth/token.test.ts` |
| Successful password update | Integration | `__tests__/api/auth/reset-password.test.ts` |
| Token single-use enforcement | Integration | same |
| Rate limit blocks 6th request | Integration | same |
| ForgotPasswordForm renders + submits | Component | `__tests__/components/ForgotPasswordForm.test.tsx` |
| ResetPasswordForm validation errors | Component | `__tests__/components/ResetPasswordForm.test.tsx` |

**Run tests:**
```bash
npm test
# or
npx jest --testPathPattern="auth"
```

---

## Rollout Plan

1. **Prerequisites:** Introduce DB (Prisma + PostgreSQL) and email provider (e.g. Resend, SendGrid) before this feature.
2. **Migration:** Run `create_users` → `create_password_reset_tokens` migrations in order.
3. **Environment variables to add:**
   ```
   DATABASE_URL=postgres://...
   EMAIL_FROM=noreply@yourapp.com
   EMAIL_API_KEY=...
   NEXTAUTH_SECRET=...         # if using NextAuth
   RESET_TOKEN_EXPIRY_MINUTES=15
   APP_URL=https://yourapp.com
   ```
4. **Feature flag (optional):** Gate behind `FEATURE_AUTH=true` env var until fully tested.
5. **Backward compatibility:** Existing localStorage-only users are unaffected until they register an account.
6. **Staged rollout:** Deploy to staging, test end-to-end email flow, then promote to production.

---

## Links to Related Docs

- User guide: [../user/how-to-password-reset.md](../user/how-to-password-reset.md)
- Project architecture: [../../CLAUDE.md](../../CLAUDE.md)
