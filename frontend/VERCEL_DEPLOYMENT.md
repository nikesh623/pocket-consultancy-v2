# Vercel Deployment Guide — Pocket Consultancy V2 Frontend

This guide explains how to deploy the **Pocket Consultancy V2** Next.js frontend independently to **Vercel** and connect it with your hosted FastAPI backend.

---

## 1. Architecture Overview

```text
       +-------------------------------+
       |             Users             |
       +---------------+---------------+
                       |
                       v
       +-------------------------------+
       |        Vercel Frontend        |
       |     Next.js 16 (App Router)   |
       +---------------+---------------+
                       | HTTPS / JWT Bearer
                       v
       +-------------------------------+
       |        FastAPI Backend        |
       | (Render / Railway / Fly / VPS)|
       +---------------+---------------+
                       | AsyncMongoClient
                       v
       +-------------------------------+
       |       MongoDB Database        |
       |    (MongoDB Atlas / Docker)   |
       +-------------------------------+
```

The frontend runs independently as a serverless Next.js application on Vercel. All data mutations, business logic, file storage, and authentication are handled by the FastAPI backend.

---

## 2. Pre-Deployment Checklist

1. **Deploy the FastAPI Backend:** Ensure your FastAPI backend is running and accessible over public HTTPS (e.g., `https://api.pocketconsultancy.com`).
2. **Configure Backend CORS:** On your FastAPI backend hosting environment (e.g. `.env`), set `ALLOWED_ORIGINS` to include your Vercel production domain and preview URLs:
   ```env
   ALLOWED_ORIGINS=https://pocket-consultancy-frontend.vercel.app,https://your-custom-domain.com
   ```
3. **Verify Health Endpoint:** Ensure `https://your-backend-url/health` returns `{"status": "healthy"}`.

---

## 3. Deploying via Vercel Dashboard (GitHub / GitLab / Bitbucket)

1. Push your repository to your Git provider.
2. Log into [vercel.com](https://vercel.com) and click **"Add New..." > "Project"**.
3. Select your repository.
4. **Configure Project Settings:**
   * **Framework Preset:** `Next.js`
   * **Root Directory:** Click "Edit" and choose `frontend`.
   * **Build Command:** `npm run build` (or leave default Next.js build).
   * **Output Directory:** Leave default (`.next`).
5. **Environment Variables:**
   Under **Environment Variables**, add:
   * **Key:** `NEXT_PUBLIC_API_BASE_URL`
   * **Value:** `https://your-production-fastapi-backend.com`
   *(Do NOT add a trailing slash)*.
6. Click **"Deploy"**.

---

## 4. Deploying via Vercel CLI

If you have the Vercel CLI installed:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Login to Vercel
vercel login

# 3. Link project
vercel link

# 4. Set environment variable
vercel env add NEXT_PUBLIC_API_BASE_URL production
# When prompted, enter your backend URL: https://your-backend.com

# 5. Deploy to Production
vercel --prod
```

---

## 5. Security & Authentication Notes

* **JWT Tokens:** The frontend transmits tokens via `Authorization: Bearer <access_token>` headers. Access tokens expire in 60 minutes and are rotated automatically using the backend's `/api/v1/auth/refresh` endpoint.
* **CORS & Cookies:** The FastAPI backend uses explicit CORS origins (`allow_origins=ALLOWED_ORIGINS`, `allow_credentials=True`). Never set wildcard `*` with credentials enabled.
* **Document Downloads:** Document files are streamed from protected FastAPI endpoints (`/api/v1/documents/{id}/download`). The frontend retrieves the file binary with active bearer tokens, preventing unauthenticated access.
* **Never commit secrets:** The frontend only needs `NEXT_PUBLIC_API_BASE_URL`. Never put backend database URIs or JWT secret keys in the frontend repository or Vercel environment.

---

## 6. Post-Deployment Verification

Once deployed:
1. Visit your Vercel URL (e.g. `https://pocket-consultancy-frontend.vercel.app`).
2. Open DevTools Network tab and verify that requests to `NEXT_PUBLIC_API_BASE_URL/api/v1/...` succeed.
3. Test login with the administrator credentials configured on the backend. Do not use the example credentials from `.env.example` in production.
4. Test student registration and verify that the approval notice is presented.
5. Upload a sample PDF document in the student workspace and verify that the documentation officer can inspect and approve it.
