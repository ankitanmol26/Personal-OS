# PersonalOS Backend

This is the Spring Boot backend for PersonalOS, serving as the central REST API for the application.

## 1. Required Software
- Java 17
- Maven
- MySQL Server

## 2. MySQL Database Creation
Before running the backend, create the database in MySQL. Open your MySQL shell or client and run:

```sql
CREATE DATABASE personal_os;
```

(The `tasks` table will be created automatically by Hibernate when the application starts due to `spring.jpa.hibernate.ddl-auto=update`).

## 3. Environment Variables
The application uses the following environment variables to connect to the database. If not provided, it falls back to default values.

- `DB_URL` (default: `jdbc:mysql://localhost:3306/personal_os?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`)
- `DB_USERNAME` (default: `root`)
- `DB_PASSWORD` (default: `root`)

## 4. How to start Spring Boot
You can start the backend using Maven:

```bash
cd backend
mvn spring-boot:run
```

Ensure your MySQL server is running before starting the application.

## 5. API Endpoints

### Health
- `GET /api/health` - Check if the API is running

### Tasks
- `GET /api/tasks` - Retrieve all tasks
- `GET /api/tasks/{id}` - Retrieve a specific task by ID
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/{id}` - Update an existing task
- `DELETE /api/tasks/{id}` - Delete a task

## 6. Example POST request
To create a task, send a `POST` request to `http://localhost:8080/api/tasks` with the following JSON body:

```json
{
  "text": "Solve Two Sum",
  "category": "DSA",
  "priority": "High",
  "dueDate": "2026-10-07",
  "completed": false
}
```

## 7. Example response
```json
{
  "id": 1,
  "text": "Solve Two Sum",
  "category": "DSA",
  "priority": "High",
  "dueDate": "2026-10-07",
  "completed": false
}
```
