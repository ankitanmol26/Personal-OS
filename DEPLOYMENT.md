# PersonalOS -- Complete Free Tier Production Deployment Guide

This guide provides step-by-step instructions to prepare and deploy PersonalOS using free tier cloud services:
- Database: Aiven Free Tier (MySQL 8, managed cloud database with mandatory SSL)
- Backend: Render Free Tier (Spring Boot 3.3.4, Java 17 / Docker)
- Frontend: Vercel Free Tier (React 19 + Vite 8 SPA and PWA)

---

## Architecture and Communication Flow

```text
                      +--------------------------------------+
                      |          Vercel (Frontend)           |
                      |  https://<your-app>.vercel.app       |
                      |  React 19 + Vite + PWA + STOMP / WS  |
                      +------------------+-------------------+
                                         |
                        HTTPS API (JSON) | WSS (WebSocket)
                        Credentials: include (SameSite=None)
                                         |
                      +------------------v-------------------+
                      |           Render (Backend)           |
                      |  https://<your-api>.onrender.com     |
                      |  Spring Boot 3.3.4 (Java 17, Docker) |
                      |  Port dynamically bound via $PORT    |
                      +------------------+-------------------+
                                         |
                         TLS / SSL Encrypted JDBC
                         useSSL=true&requireSSL=true
                                         |
                      +------------------v-------------------+
                      |          Aiven (Database)            |
                      |  MySQL 8 Managed Service             |
                      |  Port: <aiven-port>, DB: defaultdb   |
                      +--------------------------------------+
```

---

## Free Tier Limitations and Operational Realities

Before deploying, understand the realistic constraints of free tier hosting:

1. Render Free Web Service:
   - Memory: 512 MB RAM limit. The Dockerfile specifies `-XX:MaxRAMPercentage=75.0` to prevent JVM Out-Of-Memory (OOM) crashes.
   - Inactivity Spin-Down: Free instances spin down after 15 minutes of inactivity. The next incoming request triggers a cold start taking ~45-60 seconds.
   - Monthly Free Hours: 750 hours/month per account (sufficient for one web service running continuously all month).
   - Ephemeral Filesystem: Any files written to the local container disk are discarded when the container restarts or spins down. (PersonalOS stores all data in MySQL; user avatars are stored as URLs).
   - Uptime: Free tier does not provide service level agreements (SLAs) or guaranteed uninterrupted uptime.

2. Aiven Free MySQL:
   - Resource Quotas: 1 CPU, 1 GB RAM, 5 GB storage.
   - Connection Limits: Maximum concurrent connections are limited (typically 20-30). The backend configuration caps HikariCP pool size (`DB_POOL_SIZE=5` or `10`) to prevent exhausting database connections.
   - Mandatory SSL: Aiven strictly rejects unencrypted plaintext connections.

3. Vercel Free (Hobby) Tier:
   - Bandwidth: 100 GB/month.
   - Global Edge CDN: Fast global static asset delivery.
   - Policy: Intended for personal, non-commercial use.

---

## Pre-Deployment Verification Status

- Production Hibernate DDL auto is disabled: `spring.jpa.hibernate.ddl-auto=none` in `application-prod.properties`.
- Automatic migration and bootstrap user creation are disabled in production: `personalos.migration.auto-ddl.enabled=false` and `personalos.migration.bootstrap-user.enabled=false`.
- The database schema is defined in `backend/src/main/resources/schema.sql` (15 tables with foreign keys and cascade rules).
- CORS origin validation is handled by `AllowedOriginsProvider.java`, which strictly verifies RFC 6454 origins without wildcards and excludes localhost in production.
- Refresh token cookies use `SameSite=None` and `Secure=true` in `application-prod.properties` for cross-site HTTPS between Vercel and Render, with a JSON payload fallback in `apiClient.js`.
- SPA client-side routing is configured via `vercel.json` rewrite (`/(.*) -> /index.html`).
- Backend health check endpoint is available at `/api/health` with HTTP 200 `{"status":"UP"}`.

---

## Step 1: Database Setup (Aiven MySQL 8)

Aiven provides managed MySQL 8 with SSL encryption.

### 1.1 Connection Details (Keep Private)
From your Aiven MySQL Service Overview tab, obtain:
- Hostname: `mysql-<project-id>.aivencloud.com`
- Port: e.g. `12345`
- User: `avnadmin`
- Password: `<your-secure-password-from-aiven>`
- Database: `defaultdb`

### 1.2 Initialize Schema (Execute Once)
Because automatic DDL generation is disabled in production, initialize the 15 tables once:

Option A -- Via Aiven Web Console:
1. In the Aiven Console, open your MySQL service.
2. Click "Query editor" in the left menu.
3. Open `backend/src/main/resources/schema.sql` from the repository, copy all text, paste it into the editor, and click "Run query".
4. Confirm all 15 tables are present:
   `users`, `google_identities`, `refresh_tokens`, `tasks`, `dsa_problems`,
   `projects`, `project_tasks`, `notes`, `planner_tasks`, `trips`,
   `trip_members`, `trip_contributions`, `shared_expenses`,
   `shared_expense_splits`, `transactions`.

Option B -- Via MySQL CLI:
```bash
mysql -h <aiven-host> -P <aiven-port> -u avnadmin -p defaultdb < backend/src/main/resources/schema.sql
```

---

## Step 2: Backend Deployment (Render Free Web Service)

Render runs the Spring Boot application and assigns an HTTPS URL (`https://<service-name>.onrender.com`).

### 2.1 Create the Service
1. Log in to [render.com](https://render.com/).
2. Click "New +" -> "Web Service".
3. Select your repository `ankitanmol26/Personal-OS`.
4. Configure service settings:
   - Name: `personalos-backend`
   - Region: Select region closest to your Aiven database
   - Branch: `main`
   - Instance Type: `Free`

### 2.2 Build and Runtime Settings
Render supports both Docker (recommended) and native Java:

Option A: Docker (Recommended)
- Environment: `Docker`
- Dockerfile Path: `backend/Dockerfile`
- Docker Build Context: `backend`
- Health Check Path: `/api/health`

Option B: Native Java
- Root Directory: `backend`
- Environment: `Java`
- Build Command: `mvn clean package -DskipTests`
- Start Command: `java -Dspring.profiles.active=prod -XX:MaxRAMPercentage=75.0 -jar target/backend-0.0.1-SNAPSHOT.jar`
- Health Check Path: `/api/health`

### 2.3 Backend Environment Variables (Configure in Render Dashboard)
Under the "Environment" tab of the Render Web Service, add:

| Environment Variable Name | Required Value / Format | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates production configuration |
| `DB_URL` | `jdbc:mysql://<aiven-host>:<aiven-port>/defaultdb?useSSL=true&requireSSL=true&verifyServerCertificate=false&serverTimezone=UTC` | Aiven MySQL JDBC URL with mandatory SSL |
| `DB_USERNAME` | `avnadmin` | Aiven database user |
| `DB_PASSWORD` | `<your-aiven-db-password>` | Aiven database password |
| `DB_POOL_SIZE` | `5` (or `10`) | HikariCP max pool size for cloud tier |
| `PERSONALOS_JWT_SECRET` | Cryptographically secure random secret (min 32 random bytes) | HMAC-SHA256 signing secret |
| `PERSONALOS_FRONTEND_URL` | `https://<your-project>.vercel.app` | Production frontend URL (update after Vercel deployment) |
| `GOOGLE_OAUTH_CLIENT_ID` | `<client-id>.apps.googleusercontent.com` | Google OAuth Client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | `<google-oauth-client-secret>` | Google OAuth Client Secret |

Note on `PERSONALOS_JWT_SECRET`:
The backend uses HMAC-SHA256 (`Keys.hmacShaKeyFor`), which strictly requires at least 256 bits (32 bytes) of key material. An ordinary 32-character password or passphrase does not guarantee 256-bit entropy. You must generate a cryptographically secure random secret with at least 32 random bytes:
- **Bash / OpenSSL:** `openssl rand -hex 32` (outputs a 64-character hex string representing 32 random bytes) or `openssl rand -base64 32`
- **Windows PowerShell:**
  ```powershell
  $bytes = New-Object byte[] 32; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
  ```

Note on PORT: Render injects the `PORT` environment variable automatically. The application binds to it via `server.port=${PORT:8080}`.

### 2.4 Verify Backend
Once deployed, verify by opening:
`https://<your-backend>.onrender.com/api/health`
Expected response: HTTP 200 `{"status":"UP"}`

---

## Step 3: Frontend Deployment (Vercel Free Tier)

### 3.1 Import Project
1. Log in to [vercel.com](https://vercel.com/).
2. Click "Add New..." -> "Project".
3. Import `ankitanmol26/Personal-OS`.
4. Configure Build and Output Settings:
   - Framework Preset: `Vite`
   - Root Directory: `./` (root of repository)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 3.2 Frontend Environment Variables (Configure in Vercel Dashboard)

| Environment Variable Name | Required Value / Format | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `https://<your-backend>.onrender.com` | Backend API base URL (no trailing slash) |
| `VITE_WS_URL` | `wss://<your-backend>.onrender.com/ws` | Secure WebSocket endpoint |
| `VITE_GOOGLE_CLIENT_ID` | `<client-id>.apps.googleusercontent.com` | Google OAuth Web Client ID |

### 3.3 Deploy
1. Click "Deploy".
2. When finished, Vercel provides your production URL: `https://<your-project>.vercel.app`.
3. Client-side routing for `/login`, `/dashboard`, `/trips`, etc. is handled by `vercel.json` without 404 errors.

---

## Step 4: Finalize Inter-Service Configuration

### 4.1 Update CORS Origin in Render
In Render -> Web Service -> Environment:
- Update `PERSONALOS_FRONTEND_URL` to match your exact Vercel URL:
  `https://<your-project>.vercel.app`
- Click "Save Changes". Render will automatically redeploy with the updated CORS policy.

### 4.2 Configure Google Cloud OAuth 2.0 Credentials
PersonalOS uses Google Identity Services with a popup authorization-code flow (`useGoogleLogin({ flow: 'auth-code' })`).

How this flow works:
- When a user clicks "Continue with Google", Google opens an authentication popup.
- Upon user approval, Google securely transmits the authorization code back to the parent window via HTML5 `window.postMessage` (no full-page browser redirection occurs).
- The frontend forwards this authorization code, the literal parameter `redirectUri: 'postmessage'`, and the anti-CSRF state token to the backend at `POST /api/auth/google`.
- The backend's `GoogleTokenValidator` exchanges this code at `https://oauth2.googleapis.com/token` using `redirect_uri="postmessage"`.

Google Cloud Console Configuration:
1. Open [Google Cloud Console](https://console.cloud.google.com/) -> "APIs & Services" -> "Credentials".
2. Select your OAuth 2.0 Web Client ID (Application type: "Web application").
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for local development)
   - `https://<your-project>.vercel.app` (for production frontend, without trailing slash)
   *(Google requires this to authorize the popup postMessage communication).*
4. Under **Authorized redirect URIs**:
   - In this popup postMessage flow, Google transmits the code directly to the opener window, so no redirect URI is invoked during login.
   - You do not need to register a redirect URI for this flow to function.
   - Note: Do not enter `postmessage` in this field; Google Cloud Console validates URI syntax and will reject it as an invalid format. If your OAuth client already has redirect URIs registered for other applications or standard redirect flows (e.g., `https://<your-project>.vercel.app/login`), they may safely remain, but they are not used by this popup flow.
   *(Technical Reference: `@react-oauth/google` v0.13.5 delegates to Google Identity Services `google.accounts.oauth2.initCodeClient` in popup mode, where Google sets `redirect_uri="postmessage"` for code exchange and verifies the caller origin via Authorized JavaScript origins).*
5. Click "Save". Changes take 1 to 5 minutes to propagate across Google edge caches.

---

## Step 5: Post-Deployment Smoke Test

Perform these checks in your browser:

1. Health Check:
   Navigate to `https://<your-backend>.onrender.com/api/health`. Expected: `{"status":"UP"}`.

2. Registration and Login:
   Navigate to `https://<your-project>.vercel.app/register`. Create a test user account.
   Check DevTools (F12) -> Network tab -> `/api/auth/register` and `/api/auth/login`.
   Verify the response returns HTTP 200/201 and sets the `refreshToken` cookie.

3. Cookie Persistence:
   In DevTools -> Application tab -> Cookies -> backend domain.
   Verify `refreshToken` has `Secure`, `HttpOnly`, and `SameSite=None`.
   Refresh the page. Verify `/api/auth/me` succeeds and user remains logged in.

4. WebSocket STOMP Connection:
   Navigate to `/trips` and open a trip.
   In DevTools -> Network tab -> filter by "WS".
   Verify a connection to `wss://<your-backend>.onrender.com/ws` with status `101 Switching Protocols`.

5. Offline PWA Test:
   In DevTools -> Network tab -> toggle Throttling to "Offline".
   Reload the page. Verify the application shell loads from cache.

---

## Step 6: Backup, Rollback, and Troubleshooting

### Database Backups
- In the Aiven Console, check your MySQL service's "Backups" tab to review the backup policy and retention settings applicable to your specific service plan.
- Because automated backup availability and retention schedules on free-tier services can be limited or subject to plan changes, maintain an independent backup routine.
- To take a manual export of your database from your terminal:

  **Bash (Linux / macOS / Git Bash):**
  ```bash
  mysqldump -h <aiven-host> -P <aiven-port> -u avnadmin -p defaultdb > backup_$(date +%Y%m%d).sql
  ```

  **Windows PowerShell:**
  ```powershell
  mysqldump -h <aiven-host> -P <aiven-port> -u avnadmin -p defaultdb --result-file="backup_$(Get-Date -Format 'yyyyMMdd').sql"
  ```
  *(Note: Using `--result-file` avoids stdout text encoding issues common with PowerShell output redirection).*

### Rollback Strategy
- Vercel Frontend: Vercel Dashboard -> Deployments -> click previous successful deployment -> "Instant Rollback".
- Render Backend: Render Dashboard -> Deploys -> click previous working deploy -> "Rollback to this deploy".

### Common Issues
- Cold start delay (~50 seconds): Expected behavior on the Render free tier. Free web services automatically spin down after 15 minutes of inactivity. When a new request arrives, starting the container takes approximately 45-60 seconds before processing requests.
- CORS error in browser console: Verify `PERSONALOS_FRONTEND_URL` in Render matches your Vercel domain exactly with `https://` and without a trailing slash.
- Database connection failure: Confirm the `DB_URL` contains `?useSSL=true&requireSSL=true&verifyServerCertificate=false`. Aiven requires SSL.
- Google OAuth error: Ensure `https://<your-project>.vercel.app` is added to "Authorized JavaScript origins" in Google Cloud Console.
