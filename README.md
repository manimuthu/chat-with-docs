
# 📦 Document Management and RAG-based Q&A System

This project is a full-stack application consisting of:

- **NestJS Backend** (`/backend`) – Handles auth, document upload, and ingestion triggers
- **React Frontend** (`/frontend`) – UI for document management, ingestion, and Q&A
- **Python RAG API** (`/rag-api`) – Ingests documents and performs retrieval-augmented generation (RAG)

---

## 🐳 Dockerized Setup

### 📁 Project Structure

```
project-root/
├── backend/      # NestJS app
├── frontend/     # React app
└── rag-api/      # Python (Flask/FastAPI) API for RAG
```

---

## ⚙️ Prerequisites

- Docker installed: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
- Docker Compose installed

---

## ▶️ Quick Start

From the `project-root` directory, run:

```bash
docker-compose up --build
```

Access the services:

- Frontend: [http://localhost:8080](http://localhost:8080)
- Backend (NestJS): [http://localhost:3000/api](http://localhost:3000/api)
- RAG API (Python): [http://localhost:5000](http://localhost:5000)

---

## 🔗 API Routing (Docker-aware)

Docker Compose configures the **NestJS backend** to reach the Python API by its
service name:

```yaml
RAG_API_URL: http://rag-api:5000
```

Docker Compose mounts `backend/uploads` into both the backend and Python containers,
so uploaded PDFs are available to the Python ingestion API. If running both services
directly on your machine instead of in Docker, the backend defaults to
`http://localhost:5000`, and the Python API reads from `backend/uploads`.

---

## 📝 Dockerfile Summary

### NestJS Backend (`/backend/Dockerfile`)

```Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### React Frontend (`/frontend/Dockerfile`)

```Dockerfile
FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Python RAG API (`/rag-api/Dockerfile`)

```Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

> Replace `app.py` with your Python API's actual entry point if different.

---

## 🐙 GitHub & Deployment

You can push this setup to GitHub and optionally:

- Add `.dockerignore` files to each service
- Include `.env.example` files for config variables
- Extend `docker-compose.yml` to add Postgres or Redis

---

## ✅ Optional Enhancements

- Add volumes for live-reloading in development
- Configure CI/CD with GitHub Actions or GitLab
- Dockerize with environment-specific `.env` handling

---

## 📞 Need Help?

Feel free to reach out in case of issues. Happy coding! 🚀
