# PersonalOS

PersonalOS is a personal productivity, life operations, and shared financial tracking operating system built with a high-performance modern tech stack.

- **Frontend:** React 19, Vite 8, Framer Motion, Lucide Icons, Vite PWA
- **Backend:** Java 17, Spring Boot 3.3.4, Spring Security, JWT (HMAC-SHA256), Spring WebSocket / STOMP
- **Database:** MySQL 8 with JPA / Hibernate

---

## Architecture Overview

```
                      ┌─────────────────────────────────┐
                      │        Vercel (Frontend)        │
                      │  React 19 + Vite PWA + SockJS   │
                      └───────────────┬─────────────────┘
                                      │
                         REST API & STOMP WebSocket
                                      │
                      ┌───────────────▼─────────────────┐
                      │         Render (Backend)        │
                      │     Spring Boot 3.3.4 Docker    │
                      └───────────────┬─────────────────┘
                                      │
                                  JDBC / TLS
                                      │
                      ┌───────────────▼─────────────────┐
                      │   Managed MySQL (e.g. Aiven)    │
                      │    Relational MySQL 8 Schema    │
                      └─────────────────────────────────┘
```

---

## Local Development Setup

### Prerequisites
- Node.js 20+ & npm
- JDK 17 (Eclipse Temurin or OpenJDK)
- Apache Maven 3.8+
- MySQL 8 server running locally

### 1. Database Setup
Create the local MySQL database:
```sql
CREATE DATABASE personal_os CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup
1. Copy the local configuration example:
   ```bash
   cp backend/application-local.properties.example backend/application-local.properties
   ```
2. Edit `backend/application-local.properties` with your local MySQL password and a strong JWT secret (min 32 characters).
3. Run the backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   The backend starts at `http://localhost:8080`.

### 3. Frontend Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure `VITE_GOOGLE_CLIENT_ID` with your Google Cloud OAuth Web Client ID.
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
   The frontend runs at `http://localhost:5173`.

---

## Production Deployment Guide

### Target Infrastructure
- **Frontend Target:** Vercel
- **Backend Target:** Render (Web Service via Docker)
- **Database Target:** Managed MySQL (e.g., Aiven MySQL, AWS RDS, or PlanetScale)

---

### Step 1: Managed Database Initialization (Aiven MySQL)

1. Provision a MySQL 8 service on your cloud provider (e.g., Aiven).
2. Connect using the MySQL CLI or a database client (e.g., DBeaver):
   ```bash
   mysql -h <cloud-mysql-host> -P <port> -u <username> -p <database-name> < backend/src/main/resources/schema.sql
   ```
3. The authoritative [schema.sql](file:///backend/src/main/resources/schema.sql) creates all 15 relational tables with strict foreign keys, cascading constraints, and indexes.

> **Production Safety Policy:** Automatic startup DDL migrations and bootstrap account insertion are **strictly disabled** in production (`application-prod.properties`). This prevents concurrent migration races, accidental schema alterations, and unauthorized default user accounts.

---

### Step 2: Backend Deployment (Render)

1. Create a new **Web Service** on Render connected to this repository.
2. Select **Docker** environment. Render will detect `render.yaml` or you can manually configure:
   - **Root Directory:** `backend`
   - **Dockerfile Path:** `Dockerfile` (or `backend/Dockerfile` if building from root)
   - **Health Check Path:** `/api/health`
3. Configure the following environment variables in the Render Dashboard:

| Environment Variable | Description | Example / Format |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Activates production profile | `prod` |
| `DB_URL` | JDBC connection string to managed MySQL | `jdbc:mysql://<host>:<port>/<dbname>?useSSL=true&serverTimezone=UTC` |
| `DB_USERNAME` | Cloud MySQL username | `avnadmin` |
| `DB_PASSWORD` | Cloud MySQL password | `<your-db-password>` |
| `DB_POOL_SIZE` | HikariCP maximum connection pool size | `10` |
| `PERSONALOS_JWT_SECRET` | Strong HMAC-SHA256 signing secret (≥ 32 bytes) | `<cryptographic-random-string>` |
| `PERSONALOS_FRONTEND_URL` | Production URL of your Vercel frontend | `https://your-personal-os.vercel.app` |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth Client ID | `<client-id>.apps.googleusercontent.com` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth Client Secret | `<client-secret>` |
| `PORT` | Web server port (Render sets this automatically) | `8080` |

---

### Step 3: Frontend Deployment (Vercel)

1. Import this repository into Vercel.
2. Set the project root to `/` (default).
3. Build Settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Configure the following environment variables in Vercel:

| Environment Variable | Description | Example / Format |
|---|---|---|
| `VITE_API_BASE_URL` | Full URL of the Render backend web service | `https://your-backend.onrender.com` |
| `VITE_WS_URL` | Optional WebSocket URL (defaults to `wss://your-backend.onrender.com/ws`) | `https://your-backend.onrender.com/ws` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | `<client-id>.apps.googleusercontent.com` |

5. Vercel automatically honors [vercel.json](file:///vercel.json) to handle SPA routing rewrites (`/(.*) -> /index.html`).

---

### Step 4: Google Cloud OAuth Configuration

After your Vercel domain is known (e.g., `https://your-personal-os.vercel.app`):

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**.
2. Open your OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (local development)
   - `https://your-personal-os.vercel.app` (production frontend)
4. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173/login`
   - `https://your-personal-os.vercel.app/login`
5. Save changes. Google OAuth takes 1–5 minutes to propagate.

---

## Verification & Continuous Integration

This project includes automated testing and build verification via GitHub Actions ([.github/workflows/ci.yml](file:///.github/workflows/ci.yml)):

- **Frontend Verification:**
  - `npm run lint` (ESLint checks)
  - `npm run build` (Vite production bundle & PWA service worker generation)
- **Backend Verification:**
  - `mvn test` (24 JUnit 5 tests covering Auth, RefreshToken rotation, Trips, Shared Expenses, JWT validation)
  - `mvn package -DskipTests` (Spring Boot executable JAR packaging)
