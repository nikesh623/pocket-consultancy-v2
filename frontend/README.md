# Pocket Consultancy V2 — Frontend Application

A full-featured Next.js frontend built for the **Pocket Consultancy V2** Education Consultancy Management System, ready for independent deployment on Vercel.

---

## 🌟 Key Features

* **SaaS Public Website:** High-converting landing page with animated eligibility mockups, 5-stage consultancy workflow, global destination cards, trust & security highlights, and responsive navigation.
* **Public Program Explorer (`/destinations`):** Real-time course and destination discovery with search and country filters.
* **Unified Role-Based Login (`/login`):** Role detection redirecting authenticated users to their authorized workspace, complete with demo credentials for instant local evaluation.
* **Student Registration (`/register`):** Registration workflow enforcing minimum password criteria and transparently communicating the mandatory administrator approval gate.
* **Student Workspace (`/dashboard/student`):**
  * Academic profile wizard (qualifications, scores, budget amount, currency, target destinations).
  * Transparent rule-based course recommendation engine with textual match explanations.
  * Shortlist management and direct application submission.
  * 1-on-1 counselor appointment booking.
  * Secure document center (5MB limit, PDF/image validation, officer feedback review, and authenticated downloads).
  * Multi-stage application status progress tracker and status audit timeline.
* **Administrator Console (`/dashboard/admin`):**
  * Real-time platform metrics (total users, pending approvals, counselors, applications).
  * Student approval & rejection queue.
  * User management & internal staff creation (counselors, documentation officers, administrators).
  * Counselor assignment to prospective students.
  * Study destination countries and university registry management.
  * Course catalog and minimum entry criteria management.
  * Global appointment, application, and document oversight.
* **Counselor Workspace (`/dashboard/counselor`):**
  * Availability slot publisher for student consultation bookings.
  * Appointment lifecycle management (confirm, complete, cancel).
  * Assigned student dossiers and academic profile inspection.
  * Private consultation notes attached to student records.
* **Documentation Officer Workspace (`/dashboard/documentation`):**
  * Priority document verification queue.
  * In-app document preview (PDF and images) fetched via authenticated bearer token.
  * One-click approval and rejection with official reviewer feedback comments.

---

## 🛠️ Technology Stack

* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript (Strict mode)
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Charts:** Recharts
* **State & Auth:** React Context + Token Storage Interceptors
* **Backend Integration:** REST API against FastAPI backend (`http://localhost:8000`)

---

## 🚀 Getting Started Locally

### 1. Ensure Backend is Running
Verify that the FastAPI backend is running:
```bash
curl http://localhost:8000/health
# Should return {"status": "healthy"}
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env.local
```
Ensure `NEXT_PUBLIC_API_BASE_URL` points to your running FastAPI backend:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Install Dependencies
```bash
npm ci
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🚢 Deploying to Vercel

Refer to the complete deployment guide in [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

Quick steps:
1. Connect repository to Vercel.
2. Set **Root Directory** to `frontend`.
3. Set Environment Variable: `NEXT_PUBLIC_API_BASE_URL=https://your-production-fastapi-backend.com`.
4. Deploy!
