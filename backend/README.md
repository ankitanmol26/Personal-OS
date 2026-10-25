# PersonalOS Backend Service

The Spring Boot backend for PersonalOS provides a secure, high-performance RESTful API and WebSocket message broker for productivity tracking, life operations, and multi-user travel financial settlements.

---

## Technical Specifications

- **Language & Runtime:** Java 17 (Eclipse Temurin / OpenJDK)
- **Framework:** Spring Boot 3.3.4
- **Security:** Spring Security 6 with stateless JWT authentication (HMAC-SHA256) and Google OAuth 2.0 integration
- **Persistence:** Spring Data JPA with Hibernate ORM
- **Database:** MySQL 8 with HikariCP connection pooling
- **Messaging:** Spring WebSocket with STOMP broker (`/ws`, `/topic`)
- **Testing:** JUnit 5, Mockito, Spring Boot Test (8 test suites covering auth, security filters, JWT, and split calculation invariants)
- **Containerization:** Multi-stage Docker build

---

## Database Architecture

The application persists data across 15 relational tables defined in [schema.sql](src/main/resources/schema.sql):

- **Identity & Auth:** `users`, `google_identities`, `refresh_tokens`
- **Productivity & Tracking:** `tasks`, `dsa_problems`, `projects`, `project_tasks`, `notes`, `planner_tasks`
- **Finance & Travel:** `transactions`, `trips`, `trip_members`, `trip_contributions`, `shared_expenses`, `shared_expense_splits`

---

## Configuration Profiles

The backend supports environment-driven configuration profiles:

| Profile | Target | Auto-DDL | Log Level | Cookie Security | Notes |
|---|---|---|---|---|---|
| **Default (`application.properties`)** | Local Development | `update` | `DEBUG`/`INFO` | `secure=false`, `SameSite=Lax` | Imports local overrides from `application-local.properties` |
| **Production (`application-prod.properties`)** | Render Cloud Docker | `none` | `WARN`/`INFO` | `secure=true`, `SameSite=None` | Strictly disables automatic DDL mutations and bootstrap accounts |

---

## Local Setup & Development

### 1. Prerequisites
- Java 17+ installed and configured on your `PATH`
- Apache Maven 3.8+
- MySQL 8 server running locally on port `3306`

### 2. Database Initialization
```sql
CREATE DATABASE personal_os CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure Local Credentials
Copy the local properties template:
```bash
cp application-local.properties.example application-local.properties
```
Edit `application-local.properties` with your local database credentials and a 32-character JWT signing secret:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/personal_os?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=personalos
spring.datasource.password=your_password
personalos.jwt.secret=your_super_secret_jwt_signing_key_minimum_32_bytes_long
personalos.frontend.url=http://localhost:5173
```

### 4. Build and Run
```bash
# Run unit and integration tests
mvn test

# Start the Spring Boot application
mvn spring-boot:run
```
The backend starts at `http://localhost:8080`.

---

## Core REST API Endpoints

All endpoints except public authentication routes require a valid `Authorization: Bearer <token>` header.

### Authentication & Profile (`/api/auth`, `/api/profile`)
- `POST /api/auth/register` - Create email/password user account
- `POST /api/auth/login` - Authenticate and receive access token + HttpOnly refresh token cookie
- `GET /api/auth/google/state` - Generate cryptographic state cookie for OAuth2 flow
- `POST /api/auth/google` - Validate Google ID token and authenticate
- `POST /api/auth/refresh` - Rotate refresh token and issue fresh access token
- `POST /api/auth/logout` - Invalidate session and revoke refresh token
- `GET /api/auth/me` - Fetch authenticated user details
- `GET /api/profile/me` - Retrieve user profile and metadata
- `PUT /api/profile/me` - Update profile bio, phone, and details
- `PUT /api/profile/me/password` - Change password

### Productivity & Learning (`/api/tasks`, `/api/dsa`, `/api/projects`, `/api/notes`, `/api/planner-tasks`)
- `/api/tasks` - Full CRUD with priority levels (`Low`, `Medium`, `High`) and completion toggle
- `/api/dsa` - LeetCode problem tracker with topic, difficulty (`Easy`, `Medium`, `Hard`), and revision flags
- `/api/projects` - Project workspace with tech stack tags, progress calculation, and subtask checklists (`/{id}/tasks`)
- `/api/notes` - Categorized markdown/text scratchpad
- `/api/planner-tasks` - Daily time-blocking task scheduler by calendar date

### Personal & Group Finance (`/api/transactions`, `/api/trips`)
- `/api/transactions` - Personal income, expense, and category tracking
- `/api/trips` - Create and manage collaborative group trips
- `GET /api/trips/join/{code}` / `POST /api/trips/join/{code}` - Query and join trip via 6-character invite code
- `/api/trips/{tripId}/members` - Manage group trip participants
- `/api/trips/{tripId}/contributions` - Log pooled funds and contributions
- `/api/trips/{tripId}/shared-expenses` - Record shared trip bills with custom or equal participant splits
- `GET /api/trips/{tripId}/shared-expenses/balances` - Calculate real-time net settlement balances

### System Health
- `GET /api/health` - Health check probe returning `{"status":"UP"}`

---

## Docker Packaging

Build the production Docker container locally:
```bash
docker build -t personalos-backend .
docker run -p 8080:8080 -e SPRING_PROFILES_ACTIVE=prod personalos-backend
```
