# Pocket Consultancy V2

A complete, role-based Education Consultancy Management System featuring an asynchronous **FastAPI + MongoDB** backend and a **Next.js 16 (App Router)** frontend ready for independent deployment on **Vercel**.

---

## 🏗️ Architecture Overview

```text
       +-------------------------------+
       |             Users             |
       +---------------+---------------+
                       |
                       v
       +-------------------------------+
       |        Vercel Frontend        |
       |  Next.js 16 + Tailwind CSS    |
       |       (Port 3000 local)       |
       +---------------+---------------+
                       | REST API / JWT Bearer
                       v
       +-------------------------------+
       |        FastAPI Backend        |
       | AsyncMongoClient + Pydantic v2|
       |       (Port 8000 local)       |
       +---------------+---------------+
                       | Connection Pool
                       v
       +-------------------------------+
       |       MongoDB 8.0 Engine      |
       |       (Port 27017 local)      |
       +-------------------------------+
```

---

## 👥 Supported Roles & Workspaces

The platform strictly enforces four user roles with server-side authorization:

1. **Student (`student`):**
   * Academic profile wizard (GPA, qualifications, target study level, budget).
   * Transparent rule-based course matching engine with detailed eligibility explanations.
   * Course shortlist and application submission.
   * Counselor consultation scheduling.
   * Document upload center with client and magic-byte validation (max 5MB, PDF/JPG/PNG).
   * Multi-stage application status progress tracker and status audit timeline.
2. **Counselor (`counselor`):**
   * Consultation calendar and availability slot publishing.
   * Appointment lifecycle management (confirm, complete, cancel).
   * Assigned student dossiers and academic profile inspection.
   * Private advisory notes attached to student dossiers.
3. **Documentation Officer (`documentation_officer`):**
   * Document verification queue.
   * In-app document preview for PDFs and images.
   * Formal approval or rejection with reviewer feedback comments.
4. **Administrator (`admin`):**
   * Overview statistics and analytics.
   * Mandatory student registration approval queue.
   * User management and internal staff account creation (counselor, documentation officer, admin).
   * Counselor-to-student assignment.
   * Destination countries, universities, and degree course catalog CRUD.
   * Global appointment, document, and application status transitions.

*(Note: There is no teacher role; all roles align directly with consultancy operations).*

---

## ⚡ Quick Start (Local Development)

### 1. Start Backend & Database (Docker Compose)

From the project root:
```bash
# Create local configuration
cp .env.example .env

# Generate a random secret key
python -c "import secrets; print(secrets.token_hex(32))"
# Put the printed value in .env as SECRET_KEY, and set a unique ADMIN_PASSWORD

# Start MongoDB and FastAPI backend
docker compose up -d

# Verify health status
curl http://localhost:8000/health
# Expected output: {"status":"healthy", ...}
```
* Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
* ReDoc Specification: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Seed Demo Data (Optional)

The API creates the administrator from `.env` at first startup. To add demo counselor/officer accounts and sample catalog data, run:
```bash
docker compose exec api python scripts/seed_data.py
```
The sample accounts and passwords in the seed script are for local evaluation only. Never use them in a public deployment.

### 3. Start Frontend (Next.js 16)

From the `frontend/` directory:
```bash
cd frontend

# Install exact locked dependencies
npm ci

# Run development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Account Setup

The first administrator account uses the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from `.env`. The checked-in `.env.example` values and optional seed accounts are for local evaluation only. Set unique credentials and a generated `SECRET_KEY` before deploying anywhere public. New student accounts start pending approval until an administrator activates them.

---

## 🧪 Testing

### Backend Automated Tests
Integration tests require a running MongoDB instance. Start the project services, then run:
```bash
# Run backend test suite from the project root
docker compose up -d
python -m pip install -e ".[dev]"
pytest
```

### Frontend Production Build
```bash
cd frontend
npm ci
npm run build
```

---

## 🚢 Vercel Deployment

The frontend is structured for independent deployment to Vercel without altering the FastAPI backend.

For step-by-step instructions, see [`frontend/VERCEL_DEPLOYMENT.md`](./frontend/VERCEL_DEPLOYMENT.md).

Quick summary:
1. Connect the repository to Vercel.
2. Set **Root Directory** to `frontend`.
3. Set the environment variable:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-production-fastapi-backend.com
   ```
4. On your FastAPI backend host, configure:
   ```env
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
5. Deploy.

## 🚀 Render API Deployment

The FastAPI API runs separately from the Vercel frontend. The root-level [`render.yaml`](./render.yaml) defines a Render Blueprint for the API, uses the Dockerfile, and checks `/health`.

1. In MongoDB Atlas, verify the `pocket-consultancy-v2` cluster is active and the `pocket_app_user` database user has access to `pocket_consultancy_v2`.
2. In Render, choose **New → Blueprint**, connect this GitHub repository, and deploy the `render.yaml` Blueprint.
3. Enter the Atlas connection URI as `MONGODB_URI`; set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` when prompted. Render generates `SECRET_KEY`. Keep these values in Render, not in GitHub or chat.
4. The first Render deployment cannot connect to Atlas until Atlas allows the Render service's outbound IP ranges. Once the service exists, open its **Connect → Outbound** panel in Render and add its listed CIDR ranges to Atlas **Security → Network Access → IP Access List**. See [Render's outbound IP documentation](https://render.com/docs/outbound-ip-addresses). Do not use `0.0.0.0/0`. The existing current-IP rule only covers local development.
5. Wait for the Render service to become live and confirm `https://<render-service>.onrender.com/health` reports a healthy database.
6. In Vercel, import the same repository and set **Root Directory** to `frontend`. Configure `NEXT_PUBLIC_API_BASE_URL` to `https://<render-service>.onrender.com` with no trailing slash, then deploy.
7. Copy the Vercel production origin (for example, `https://<project>.vercel.app`) into the Render service's `ALLOWED_ORIGINS` variable. Save and redeploy the API. Add any custom frontend domain there as well.

### Render Free Plan Limitations

The Blueprint uses Render's free web-service plan because it was selected for this deployment. Free services can spin down while idle, causing a delay on the next request, and their filesystem is ephemeral. This application stores uploaded documents on local disk, so uploads can be lost when the service restarts, spins down, or redeploys. Use this deployment for evaluation only; do not rely on it for real student documents. Persistent uploads require a paid Render service with a persistent disk or an object-storage integration.

The Render Blueprint uses environment variables marked `sync: false` for credentials. Provide them in Render's dashboard; never add real values to `render.yaml`. `ALLOWED_ORIGINS` initially permits only localhost and must be changed to the deployed Vercel origin after the frontend is deployed.
