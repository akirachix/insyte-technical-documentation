# Security

Vesper handles officer accounts, officer locations and reports about fishers. Officers share phones and work on the lake with poor signal. Security is built into the backend's `core/security.py`, grouped by the **OWASP Top 10 (2025)** risk each part addresses.

## Security Architecture

- [Vesper security SAD on Figma](https://www.figma.com/design/CpWKSbUPKqZV0EjH5uKlYh/Insyte-Security-SAD?node-id=0-1&t=kwWxfQ9qhoDQaEgC-0)


## Authentication

| Control | Implementation |
|---|---|
| Passwords | Hashed with **Argon2id** (`argon2-cffi`); never stored or logged in plain text |
| Password strength | Checked when a password is set or changed |
| Access token | Signed JWT (HS256), lifetime **15 minutes** by default (`ACCESS_TOKEN_TTL_MINUTES`, 1–60) |
| Refresh token | Signed JWT, lifetime **7 days** by default (`REFRESH_TOKEN_TTL_DAYS`, 1–30) |
| Token checks | Signature, expiry, issuer (`vesper-api`), audience (`vesper-clients`) and token type |
| Sign-in lockout | **5** failed attempts lock the account for **15 minutes** |
| Invalid token | `401 Invalid or expired token`; no detail about which check failed |

## Authorisation

Every route declares the role it needs, and the service checks again on the record itself.

| Dependency | Who passes |
|---|---|
| `require_any_user` | Any active, signed-in user |
| `require_coordinator` | Patrol coordinator only |
| `require_officer` | Patrol officer only |

- **Object-level checks:** an officer can only see alerts they are or were assigned to, and only their own user record. Asking for someone else's record returns `404`, so IDs cannot be probed.
- **Identity from the token:** the officer on an inspection, report or catch check comes from the token, never from the request body.
- **Inactive accounts** are refused on every route (`403 Your account is not active.`).

## OWASP Top 10 Mapping

| Risk | How Vesper addresses it |
|---|---|
| A01 Broken Access Control | Role dependencies on every route; object-level checks in services; officer ID from the token |
| A02 Security Misconfiguration | Settings only from environment variables; production refuses SQLite, wildcard CORS and auto-created tables |
| A04 Cryptographic Failures | Argon2id passwords; signed tokens with a secret of at least 32 characters; HSTS in production |
| A05 Injection | SQLAlchemy parameterised queries; Pydantic types and limits on every input; `extra="forbid"` on update schemas |
| A07 Authentication Failures | Short-lived tokens, lockout after repeated failures, generic error messages |
| A09 Logging and Alerting Failures | Structured JSON logs with a request ID; sensitive keys redacted |
| A10 Mishandling of Exceptional Conditions | Central error handlers; safe messages with no stack traces or secrets |

## HTTP Protections

One middleware applies these to every response:

| Protection | Setting |
|---|---|
| Request ID | `X-Request-ID` on every response, also written to the logs |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `no-referrer` |
| `Cache-Control` | `no-store` |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none'` (outside the docs pages) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` in production |
| Rate limit | **120** requests per minute per client (`429` with `Retry-After: 60`) |
| Body size | **1 MB** maximum (`413`) |
| CORS | Only the origins in `CORS_ALLOWED_ORIGINS`; methods `GET`, `POST`, `PUT`, `PATCH` |
| Trusted hosts | Only the hosts in `ALLOWED_HOSTS` |

## Logging

- Every request is logged as one JSON line: time, method, path, status, duration and request ID.
- Keys such as `password`, `password_hash`, `token`, `access_token`, `refresh_token`, `authorization` and `secret` are replaced with `[REDACTED]`.
- Refused actions are logged as warnings with the user ID and reason, for example a non-coordinator trying to import zones.
- Fisher names and licence details are never written to ordinary logs.

## Secrets

| Rule | Practice |
|---|---|
| No secrets in code | All keys come from `.env` locally and from the host's secret settings in production |
| Never committed | `.env`, `.env.local` and local database files (`vesper.db`) are in `.gitignore` |
| Rotation | A secret that is exposed (pasted in chat, committed or logged) is replaced at once |
| CI | Secrets are not stored in CI configuration |

## Data Protection

- Officer locations and field reports are available only to signed-in users with the right role.
- Satellite alerts never name a person or a rig as offending; wording describes *unusual light activity*.
- Shared phones: tokens are kept in secure storage and removed on sign-out.


| Item | Purpose |
|---|---|
| Audit log of views and changes to sensitive records | Traceability and dispute review |
| Offline record encryption on the phone | Protect pending records on lost or shared phones |
| Encrypted, tested database backups | Recovery without data exposure |
