# Vor2ex Backend

Express.js API service that proxies Amazon Selling Partner API (SP-API) requests for the Vor2ex frontend. Manages user credentials via Supabase and handles product search, details, offers, and fee estimates.

---

## Architecture

```
Frontend (Next.js) → Backend (Express) → Amazon SP-API
                                 ↓
                         Supabase (credentials)
```

- **Frontend**: `https://github.com/JaimeAlonsoGA/vor2ex`
- **Backend**: This repository
- **Database**: Supabase `credentials` table stores per-user Amazon access tokens.
- **Auth**: Bearer token from Supabase auth (`Authorization: Bearer <supabase_token>`).

---

## API Endpoints

All endpoints are prefixed with `/api/amazon` and require authentication.

### Products

```
GET /api/amazon/products?keywords={keywords}&endpoint={sp-api-endpoint}&marketplace={marketplace-id}
```
- `keywords`: search terms
- `endpoint`: SP-API base URL (e.g., `https://sellingpartnerapi-na.amazon.com`) **(note: SSRF risk, see audit)**
- `marketplace`: Amazon marketplace ID (e.g., `ATVPDKIKX0DER` for US)

Returns: `{ success: boolean, data: any }`

Pagination:
```
GET /api/amazon/products/next?pageToken={token}&keywords={keywords}&endpoint={...}&marketplace={...}
GET /api/amazon/products/previous?pageToken={token}&keywords={keywords}&endpoint={...}&marketplace={...}
```

### Single Product

```
GET /api/amazon/product/:asin?endpoint={...}&marketplace={...}
```
- `:asin`: Amazon product identifier
- Returns product details

```
GET /api/amazon/product/:asin/offers?endpoint={...}&marketplace={...}
```
- Returns product offers (new condition only)

```
GET /api/amazon/product/:asin/fees?price={number}&marketplace={...}&endpoint={...}
```
- `price`: listing price in EUR (hardcoded currency)
- Returns fee estimate

### Authentication

```
POST /api/amazon/auth/validate
```
- Validates Amazon tokens for the current user.
- **WARNING:** Currently returns full credential object including tokens. See audit for fix.

### Health

```
GET /health
```
- Simple health check: `{ status: "OK", timestamp: ISO }`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_REF=your-project-ref

# Amazon LWA (single-account MVP)
AMAZON_CLIENT_ID=your-client-id
AMAZON_CLIENT_SECRET=your-client-secret
AMAZON_REFRESH_TOKEN_US_EAST=refresh-token-for-na
AMAZON_REFRESH_TOKEN_EU_WEST=refresh-token-for-eu

# (Optional) Decodo proxy
DECODO_AMAZON_PRODUCTS_APIKEY=...
DECODO_AUTHENTICATION_KEY=...
DECODO_PASSWORD=...
DECODO_ACCESS_TOKEN=...
DECODO_REALTIME_ENDPOINT=...
```

---

## Local Development

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Set up Supabase locally or use cloud. Create `credentials` table with columns:
   - `id` (uuid PK)
   - `user_id` (uuid, references auth.users)
   - `amz_access_token` (text)
   - `amz_refresh_token` (text)
   - `amz_expires_at` (timestamptz)
   - `amz_marketplace` (varchar) – domain (e.g., `com`)

3. Run dev server:
   ```bash
   npm run dev
   ```
   Server listens on `http://localhost:3001`.

4. Generate/update Supabase types:
   ```bash
   npm run update-types
   ```

5. Generate index types:
   ```bash
   npm run generate-index
   ```

---

## Known Limitations & MVP Gaps

- **No input validation on `endpoint`** – potential SSRF. Should be server-side mapping.
- **Credentials leakage** – `/auth/validate` exposes tokens; needs fix.
- **Only NA/EU regions supported** – Far East not covered.
- **Filtering not implemented** – `minPrice`, `maxPrice`, `minReviews`, `minRating`, `sales rank` are ignored.
- **No rate limiting** – may hit SP-API quotas.
- **No retries/timeouts** – transient failures fail hard.
- **No request logging** – hard to debug.
- **No automated tests** – high risk.
- **Global LWA credentials** – not multi-tenant; only one Amazon seller account can be used across all users.

See [AUDIT.md](./AUDIT.md) for full details and prioritized roadmap.

---

## Deployment

Build and start:

```bash
npm run build
npm start
```

For production, set `NODE_ENV=production`, configure proper CORS origins, and ensure all env vars are set. Use a process manager (PM2, systemd) to keep the server running.

---

## License

MIT
