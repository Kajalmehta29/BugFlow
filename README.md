# BugFlow

**BugFlow** is a full-stack bug tracking and project management platform built for software development teams. It provides a structured workflow for reporting, organizing, assigning, tracking, and resolving software issues, with **AI-powered bug triage and developer assistance** integrated directly into the workflow.

The project combines **React, Spring Boot, PostgreSQL, Redis, Docker, JWT authentication, and AI services** to create a complete issue management system.

---

## Features

### Bug & Issue Management

* Create, update, assign, and track bugs
* Priority and severity management
* Issue search, filtering, and sorting
* Complete bug lifecycle tracking
* Kanban-based workflow
* Comments and collaboration
* File attachments
* Issue activity timeline

### Project & Sprint Management

* Create and manage projects
* Add and manage project members
* Create and manage sprints
* Assign bugs to sprints
* Track sprint progress
* Project-level dashboards and analytics

### AI-Powered Bug Intelligence

BugFlow integrates AI directly into the bug reporting and development workflow.

**AI capabilities include:**

* Automated bug classification
* Priority and severity suggestions
* Component detection
* Semantic duplicate bug detection
* Issue summarization
* AI-based assignee recommendations
* Root-cause analysis
* Code-fix suggestions
* Comment summarization
* QA test-case generation
* Sprint health insights

AI suggestions can be reviewed and accepted by the user before being applied to an issue.

### Semantic Duplicate Detection

BugFlow uses the **all-MiniLM-L6-v2** embedding model to detect semantically similar issues.

```text
Bug Title + Description
          ↓
   Embedding Model
          ↓
    Vector Representation
          ↓
   Similarity Comparison
          ↓
 Potential Duplicate Issues
```

This allows BugFlow to identify similar bugs even when they use different wording.

### Authentication & Security

* JWT-based stateless authentication
* BCrypt password hashing
* Role-based authorization
* Protected frontend routes
* Spring Security
* API rate limiting
* Project-level access validation

### Roles

| Role                | Responsibilities                       |
| ------------------- | -------------------------------------- |
| **ADMIN**           | User and system management             |
| **PROJECT_MANAGER** | Projects, sprints, members, and issues |
| **DEVELOPER**       | Development and issue management       |
| **TESTER**          | Bug reporting and verification         |

---

## Bug Workflow

Issues move through a structured development lifecycle:

```text
OPEN
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
CODE_REVIEW
  ↓
TESTING
  ↓
RESOLVED
  ↓
CLOSED
```

This provides a clear view of where every issue stands in the development process.

---

## AI Architecture

BugFlow uses a provider-based AI architecture.

```text
                  BugFlow AI Layer
                         │
             ┌───────────┴───────────┐
             │                       │
       Gemini Provider        Local AI Provider
             │                       │
             └───────────┬───────────┘
                         ↓
                  AI Issue Service
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
 Classification    Recommendations   Summarization
```

The application can use the **Gemini API** for generative AI functionality.

For supported operations, BugFlow also provides local AI functionality, including semantic issue similarity using **all-MiniLM-L6-v2** embeddings.

---

## Tech Stack

### Frontend

* React 19
* React Router
* Vite
* Lucide React
* CSS

### Backend

* Java 17
* Spring Boot 3.3
* Spring Web
* Spring Data JPA
* Hibernate
* Spring Security
* JWT / JJWT
* Spring Validation
* Springdoc OpenAPI

### Database & Infrastructure

* PostgreSQL 15
* Redis 7
* Docker
* Docker Compose

### AI

* Gemini API
* LangChain4j
* all-MiniLM-L6-v2
* ONNX

---

## Architecture

```text
┌──────────────────────────────┐
│       React Frontend         │
│                              │
│ Dashboard │ Kanban │ Issues  │
│ Projects  │ Sprints │ Users  │
└──────────────┬───────────────┘
               │
            REST API
               │
               ↓
┌──────────────────────────────┐
│      Spring Boot Backend     │
│                              │
│ Controllers                  │
│      ↓                       │
│ Services                     │
│      ↓                       │
│ Repositories                 │
└──────────┬───────────┬───────┘
           │           │
           ↓           ↓
     PostgreSQL      Redis
           │
           ↓
      AI Services
     ┌─────┴─────┐
     ↓           ↓
  Gemini     Local AI
```

---

## Project Structure

```text
BugFlow/
│
├── backend/
│   ├── src/main/java/com/bugflow/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── exception/
│   │   ├── model/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have:

* Java 17+
* Node.js 18+
* npm
* Maven
* Docker & Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/Kajalmehta29/BugFlow.git
cd BugFlow
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Configure your database, Redis, JWT, and optional Gemini credentials.

Example:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/bugflow_db
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password

SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

APP_JWT_SECRET=your_jwt_secret
APP_JWT_EXPIRATION_MS=86400000

GEMINI_API_KEY=your_gemini_api_key
```

### 3. Start PostgreSQL and Redis

```bash
docker compose up -d
```

### 4. Start the backend

```bash
cd backend
mvn spring-boot:run
```

Backend:

```text
http://localhost:8080
```

### 5. Start the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## API Documentation

BugFlow uses **Springdoc OpenAPI** for interactive API documentation.

After starting the backend:

**Swagger UI**

```text
http://localhost:8080/swagger-ui.html
```

**OpenAPI Specification**

```text
http://localhost:8080/api-docs
```

---

## API Overview

Main API modules include:

```text
/api/v1/auth
/api/v1/projects
/api/v1/bugs
/api/v1/sprints
/api/v1/dashboard
/api/v1/users
/api/v1/notifications
```

AI functionality is exposed through endpoints under:

```text
/api/v1/bugs/ai
/api/v1/bugs/{id}/ai
/api/v1/sprints/{id}/ai
```

---

## Caching

**Redis** is used to improve application performance by caching frequently requested or computationally expensive data such as:

* Dashboard statistics
* Duplicate detection results
* Sprint AI insights

Cache invalidation is applied when relevant issue changes make cached data stale.

---

## Testing

Run backend tests using:

```bash
cd backend
mvn test
```

Run frontend linting using:

```bash
cd frontend
npm run lint
```

---

## Development Workflow

A typical BugFlow workflow is:

```text
Create Project
      ↓
Add Team Members
      ↓
Create Sprint
      ↓
Report Bug
      ↓
AI Analysis
      ↓
Classify / Assign Issue
      ↓
Kanban Development
      ↓
Code Review
      ↓
Testing
      ↓
Resolve
      ↓
Close
```

Throughout the lifecycle, developers and testers can collaborate through comments, attachments, and the issue activity timeline.

---

## What This Project Demonstrates

BugFlow demonstrates practical implementation of:

* Full-stack React development
* Spring Boot REST API development
* PostgreSQL database design
* JPA/Hibernate
* JWT authentication
* Role-based authorization
* Redis caching
* Dockerized infrastructure
* Kanban workflows
* Sprint management
* File handling
* API documentation with OpenAPI
* AI-powered bug triage
* Semantic similarity search
* AI-assisted debugging
* Automated QA test generation
* AI-based sprint analysis

The key focus of BugFlow is integrating **AI into an actual software engineering workflow**, rather than treating AI as a standalone chatbot.

