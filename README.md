# 🪲 BugFlow

**BugFlow** is a modern, high-performance, full-stack Bug Tracking and Sprint Management application (a lightweight, simplified Jira clone). It allows software development teams to manage projects, track issues through Scrum/Kanban boards, schedule sprints, log activity timelines, and collaborate via comments and attachment uploads.

---

## 📺 Project Demo

Since the application is run locally, here is a full demonstration video showing the user flows, dashboard statistics, Kanban boards, and real-time features.

<p align="center">
  <video src="media/demo.mp4" width="100%" controls title="BugFlow Demo Video">
    Your browser does not support the video tag. You can view the video file directly at <a href="media/demo.mp4">media/demo.mp4</a>.
  </video>
</p>

*If the video does not load automatically in your markdown viewer, you can access the file at [media/demo.mp4](media/demo.mp4).*

---

## ✨ Features

- **📊 Comprehensive Dashboards**:
  - **Global Dashboard**: Track overall system stats across all projects.
  - **Project-Specific Dashboard**: Interactive charts and cards detailing bug counts by status, priority, and severity.
- **📋 Kanban Board**:
  - Drag-and-drop workflow transition for bug statuses: `OPEN` ➜ `ASSIGNED` ➜ `IN_PROGRESS` ➜ `CODE_REVIEW` ➜ `TESTING` ➜ `RESOLVED` ➜ `CLOSED`.
  - Filter bugs instantly by Sprints, Priority, Assignee, or keyword search.
- **📁 Sprint Management**:
  - Plan and create sprints with custom date ranges.
  - Active sprint controls (e.g., transition sprint status).
- **📂 File Attachments & Previews**:
  - Upload screenshots or documents to help describe bugs.
  - Built-in preview modal for images and documents.
- **💬 Team Collaboration**:
  - Comment threads on individual bug tickets.
  - Action/Activity timeline tracking changes made to a bug.
- **🛡️ Security & Rate Limiting**:
  - Secured endpoints using JWT authentication.
  - Built-in rate-limiting filter to prevent API abuse.
  - Role-Based Access Control (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`,`TESTER`).
- **⚡ Performance Cache**:
  - Redis cache integration for high-performance dashboard statistics retrieval.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Functional Components & Hooks)
- **Tooling**: Vite (Hot Module Replacement)
- **Routing**: React Router DOM v7
- **Styling**: Vanilla CSS (Modern CSS custom variables, sleek transitions, glassmorphism, responsive grid layouts)
- **Icons**: Lucide React

### Backend
- **Core Framework**: Spring Boot 3.3.2 (Java 17)
- **Security**: Spring Security + Stateless JWT auth (`io.jsonwebtoken`)
- **Data Persistence**: Spring Data JPA & Hibernate
- **Database**: PostgreSQL (Relational schema with cascade rules)
- **Cache & Storage**: Redis (caching stats)
- **Documentation**: Springdoc OpenAPI v2 (Swagger UI)

### Infrastructure
- **Containerization**: Docker & Docker Compose

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Java Development Kit (JDK) 17**
- **Node.js (v18+) & npm**
- **Docker & Docker Compose**
- **Maven** (optional, you can also use your IDE build tools)

---

### Step 1: Clone the Repository & Configure Environment

1. Copy the example environment file at the root:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your database credentials and configuration keys:
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/bugflow_db
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=your_secure_password
   SPRING_REDIS_HOST=localhost
   SPRING_REDIS_PORT=6379
   APP_JWT_SECRET=your_jwt_secret_key_at_least_64_characters_long
   APP_JWT_EXPIRATION_MS=86400000
   VITE_API_URL=http://localhost:8080/api/v1
   ```

---

### Step 2: Spin Up Infrastructure (PostgreSQL & Redis)

Launch the database and Redis services using Docker Compose:
```bash
docker compose up -d
```
*This will spin up two alpine-based containers on ports `5432` (PostgreSQL) and `6379` (Redis) with persistent volumes.*

---

### Step 3: Run the Backend Server

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build and run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   *The backend will boot up on port `8080`. Databases and tables will be created automatically via Hibernate DDL auto-update.*

---

### Step 4: Run the Frontend Server

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run locally, usually at `http://localhost:5173`.*

---

## 🔌 API Documentation & Swagger

Once the backend is running, you can explore, test, and view the API contract using Swagger UI.

- **Interactive API Swagger Console**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **JSON OpenAPI Specifications**: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

---

## 📂 Project Structure

```text
BugFlow/
├── backend/                  # Spring Boot Service
│   ├── src/main/java/        # Java Source code
│   │   └── com/bugflow/
│   │       ├── config/       # OpenAPI, Redis setup
│   │       ├── controller/   # REST Controllers (Auth, Project, Bug, Sprint, etc.)
│   │       ├── dto/          # Requests & Response DTOs
│   │       ├── exception/    # Custom Exception Handlers
│   │       ├── model/        # Entities (User, Project, Bug, Sprint, etc.)
│   │       ├── repository/   # JPA Repositories
│   │       ├── security/     # JWT authentication & Rate Limiting filter
│   │       └── service/      # Business logic implementation
│   ├── src/main/resources/
│   │   └── application.yml   # Spring configuration profile
│   └── pom.xml               # Maven dependencies
│
├── frontend/                 # React SPA Service
│   ├── src/
│   │   ├── assets/           # Visual resources
│   │   ├── components/       # Modals (Bug detail, Attachments), Sidebar, Topbar
│   │   ├── pages/            # View components (Login, Kanban, Dashboards)
│   │   ├── services/         # api.js client wrappers
│   │   ├── App.jsx           # Main Router / Layout manager
│   │   └── main.jsx          # Entry point
│   ├── index.html            # Core layout
│   └── package.json          # Dependencies & scripts
│
├── media/                    # Showcase assets
│   └── demo.mp4              # Project Walkthrough video
│
├── docker-compose.yml        # PostgreSQL and Redis services config
├── .env.example              # Config template
└── README.md                 # Main workspace documentation (this file)
```

---

## 🔒 Security Features

1. **JSON Web Tokens (JWT)**: Login requests respond with a secure JWT. Subsequent requests pass the token in the `Authorization` header as a Bearer token.
2. **Rate Limiting Filter**: Implemented filter in the API gateway/security stack to mitigate brute-force and Denial-of-Service (DoS) attacks on endpoints.
3. **Role-Based Access Control**:
   - `ADMIN`: Full user administration capabilities and project setups.
   - `PROJECT_MANAGER`: Access to create sprints, projects, and configure team members.
   - `DEVELOPER`: Standard ticket CRUD operations, status transitions, comments, and attachments.
   - `TESTER`: Can view tickets and add comments/attachments to tickets.
