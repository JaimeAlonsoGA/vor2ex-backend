# Vor2ex Backend Audit Report

**Date:** 2026-02-16  
**Repository:** https://github.com/JaimeAlonsoGA/vor2ex-backend  
**Auditor:** Juno (OpenClaw assistant)  
**Scope:** MVP readiness for production deployment

---

## Executive Summary

The backend is a functional Node/Express + Supabase service that proxies Amazon SP-API calls. It provides basic CRUD endpoints for products, product details, offers, and fee estimates. However, several **critical** and **high** severity issues block MVP production readiness, including security vulnerabilities, missing filtering features, and lack of documentation. Immediate fixes are required before public launch.

**Critical issues (must fix):**
1. Client-controlled `endpoint` parameter enables SSRF
2. `/auth/validate` endpoint leaks Amazon access tokens
3. Region handling limited to NA/EU; Far East fails
4. Missing filtering support contradicts Issue #1 acceptance criteria

**High impact:**
- No rate limiting or retry logic
- No request logging/audit trail
- No OpenAPI documentation
- No automated tests

**Medium impact:**
- Hardcoded default domain (`com`) for new credentials
- In-memory cache not shared across processes
- No request timeouts on outbound calls
- Health check is minimal

---

## 1. Security

### 1.1 SSRF via Unvalidated `endpoint` (CRITICAL)

**Location:** `src/controllers/amazon.controllers.ts` → all controller methods pass `endpoint` directly to service; `src/services/amazon/amazon.service.ts` → `fetchAmazon` uses `query` (which includes `endpoint`) as full URL in `fetch`.

**Problem:** The client supplies the SP-API endpoint URL (e.g., `https://sellingpartnerapi-na.amazon.com`) as a query parameter. The server fetches that URL without validating that it belongs to an allowed Amazon SP-API domain. An attacker could supply an internal URL (e.g., `http://169.254.169.254/` or internal services) to probe the network or exfiltrate data.

**Evidence:**
```ts
// controller: getProducts = ... const { endpoint, marketplace } = req.query;
// service: const query = `${endpoint}/catalog/2022-04-01/items?...`;
// fetchAmazon({ query, ... }) → fetch(`${query}`) // full URL from client
```

**Recommendation:**  
- Remove the `endpoint` parameter from client requests. Instead, determine the SP-API endpoint server-side based on the marketplace ID. Use the `AMAZON_MARKETPLACES` mapping to infer region and select the correct endpoint from `AMAZON_ENDPOINTS`.  
- If you must keep the parameter for flexibility, enforce a strict whitelist against `AMAZON_ENDPOINTS` values.

### 1.2 Credential Leak in `/auth/validate` (CRITICAL)

**Location:** `src/controllers/amazon.controllers.ts:validateCredentials` returns `result` from `validateAndGetCredentials`, which includes `amz_access_token` and `amz_refresh_token`.

**Problem:** The frontend receives the user's Amazon SP-API tokens. If an adversary compromises the frontend or intercepts traffic, they can steal these tokens and impersonate the seller account.

**Evidence:**
```ts
const result = await this.amazonService.validateAndGetCredentials(userId);
res.json({
  success: true,
  data: result // <-- contains tokens!
});
```

**Recommendation:** Return a minimal boolean or object: `{ valid: true }`. Do not return credential fields.

### 1.3 Hardcoded Default Domain in `createNewCredentials`

**Location:** `src/services/amazon/amazon.service.ts:createNewCredentials` uses `const domain = 'com'`.

**Problem:** If a user selects a non-US marketplace (e.g., Germany), the credentials will be created for the US region, causing mismatched SP-API endpoint and likely authentication failures.

**Recommendation:** The `marketplace` ID from the initial request should map to a domain. Use `AMAZON_MARKETPLACES` to find the country and then `AMAZON_DOMAINS` to get the domain. Alternatively, require the client to send a `domain` or `region` field and store that.

### 1.4 Region Handling Only Supports NA and EU

**Location:** `src/services/amazon/amazon.service.ts:fetchAccessToken` chooses refresh token based on `region === "North America" ? refreshTokenUsEast : refreshTokenEuWest`.

**Problem:** Far East (Singapore, Japan, Australia, India, etc.) falls back to EU token, which is incorrect.

**Recommendation:** Extend config with `refreshTokenFarEast` or store per-user refresh tokens in the database. Better: Each user's credentials should include their LWA client ID/secret and refresh token, not global ones. This is a multi-tenant design flaw.

---

## 2. Functionality Gaps

### 2.1 Missing Filtering (BLOCKER for Issue #1)

**Acceptance Criteria:** “Accept filters: `minPrice`, `maxPrice`, `minReviews`, `minRating`, `sales rank`”

**Current State:** The `GET /api/amazon/products` endpoint only accepts `keywords`, `endpoint`, `marketplace`. No filtering.

**Recommendation:** Extend the backend to:
- Accept optional query parameters: `minPrice`, `maxPrice`, `minReviews`, `minRating`, `minSalesRank`.
- Apply filters after fetching from SP-API (or use SP-API filtering if available). Document which filters are client-side vs server-side to manage expectations.
- Update the frontend service to pass these filters.

### 2.2 Missing OpenAPI/Swagger Documentation

**Acceptance Criteria:** “Documented with OpenAPI/Swagger”

**Current State:** No documentation file; no swagger UI.

**Recommendation:** Add an OpenAPI 3.0 spec in `docs/api.yaml` or `openapi.yaml`. Include endpoints, parameters, responses, and error codes. Optionally add `swagger-ui-express` for interactive docs in development.

### 2.3 No Rate Limiting / Retry Logic

**Problem:** Direct calls to Amazon SP-API are rate-limited. Without retry with backoff, transient 429/503 errors will fail. Also, no client-side rate limiting exposes the service to abuse.

**Recommendation:** Implement:
- Exponential backoff with jitter for 429/503 responses.
- Circuit breaker pattern (e.g., `opossum`) for fault tolerance.
- Rate limiting per user/IP at the Express level (e.g., `express-rate-limit`).

### 2.4 Missing Request Timeouts

**Problem:** `fetch()` calls to Amazon have no timeout; a hung connection ties up server resources.

**Recommendation:** Wrap fetch with `AbortController` and set a reasonable timeout (e.g., 10s).

---

## 3. Architecture & Code Quality

### 3.1 Multi-tenancy Design Flaw

The backend uses global LWA credentials (`AMAZON_CLIENT_ID`, `AMAZON_REFRESH_TOKEN_*`). This implies a single Amazon seller account shared across all users. For an MVP prototype this may be acceptable if only one user is expected, but it is not a scalable design.

**Recommendation:** For MVP scope, document the limitation. For future: store each user's Amazon SP-API credentials (client ID, secret, refresh token) in the `credentials` table and use them per request.

### 3.2 Hardcoded Currency in `getFeesEstimate`

Uses EUR and shipping = 0. Should derive currency from marketplace or user preferences.

### 3.3 Logging & Observability

- No request logging (method, path, user, duration, status). Add `morgan` or pino.
- Errors only logged to console; consider structured logging (JSON) and remote aggregation.

---

## 4. Testing

- No unit or integration tests. High risk of regressions.
- For MVP, at least add smoke tests for each endpoint using `supertest`.
- Use `nock` to mock Amazon SP-API responses.

---

## 5. Documentation

- No README with setup instructions, environment variables list, or deployment guide.
- No API usage examples.

**Recommended README sections:**
- What is Vor2ex?
- Architecture diagram (frontend ↔ backend ↔ Amazon SP-API)
- Environment variables (`.env.example`)
- Local development (`npm run dev`, Supabase local)
- Testing
- Deployment notes
- OpenAPI spec location

---

## 6. Environment & Configuration

- `config.ts` uses non-null assertions (`!`) without fallbacks; server will crash if required env vars missing. Validate at startup and fail fast with clear message.
- CORS allows multiple local origins; production domain is a placeholder.

---

## 7. Performance

- In-memory credential cache is per-process. In a multi-instance deployment, each will fetch tokens independently, increasing load on Amazon LWA. Acceptable for single-instance MVP.
- No caching of Amazon SP-API responses (the frontend added caching, but backend could benefit too).

---

## 8. Actionable Roadmap (Prioritized)

### Immediate (Pre-MVP)
1. **Fix SSRF:** Remove client-provided `endpoint`; select endpoint server-side from marketplace.
2. **Fix credential leak:** Change `/auth/validate` to return `{ valid: boolean }`.
3. **Add filtering:** Implement `minPrice`, `maxPrice`, `minReviews`, `minRating`, `minSalesRank`.
4. **Add OpenAPI spec** and serve it at `/api-docs`.
5. **Add request timeouts** to all Amazon calls.
6. **Add basic request logging** (`morgan`).

### Short-term (post-MVP)
7. Implement per-user LWA credentials (endpoint selection per marketplace).
8. Add rate limiting and retry with backoff.
9. Write integration tests.
10. Add structured logging and metrics.
11. Write README with setup and usage.

---

## 9. Compliance & Legal

- Ensure compliance with Amazon SP-API policies (no caching of product data beyond allowed period, user-agent identification). Consider adding `User-Agent` header identifying your application.
- Include privacy policy if storing user data.

---

**Conclusion:** The backend is a promising prototype but requires the critical fixes above before production use. The most urgent are SSRF and token leak. Once addressed, the MVP can be considered moderately safe to run with limited users.
