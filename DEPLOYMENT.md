# Deployment Guide

This project is set up as a monorepo containing both the Frontend (React/Vite) and Backend (Node/Express).

## 1. Backend Deployment (Render.com)

1.  **Create New Web Service** on [Render](https://dashboard.render.com/).
2.  **Connect your GitHub repository**.
3.  **Configure Settings**:
    *   **Root Directory**: `backend`
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  **Environment Variables**:
    Add the following variables in the "Environment" tab:
    *   `PORT`: `5000` (Render will override this, but good to have)
    *   `MONGO_URI`: Your MongoDB connection string.
    *   `JWT_SECRET`: A secure random string.
    *   `CLOUDINARY_CLOUD_NAME`: Cloudinary Name.
    *   `CLOUDINARY_API_KEY`: Cloudinary Key.
    *   `CLOUDINARY_API_SECRET`: Cloudinary Secret.
    *   `FRONTEND_URLS`: `http://localhost:5173,https://YOUR-NETLIFY-SITE-NAME.netlify.app` (You will update this after deploying frontend).
    *   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (If using email features).
    *   `ADMIN_EMAIL`: Email for admin notifications.

5.  **Deploy**. Wait for the service to go live.
6.  **Copy the Backend URL** (e.g., `https://zarvo-backend.onrender.com`).

## 2. Frontend Deployment (Netlify)

1.  **Add New Site** -> **Import from Git** on [Netlify](https://app.netlify.com/).
2.  **Connect your GitHub repository**.
3.  **Configure Build Settings**:
    *   **Base directory**: (Leave empty or `/`)
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
4.  **Environment Variables**:
    *   Click **"Advanced"** -> **"New Variable"**.
    *   Key: `VITE_API_BASE`
    *   Value: Your Render Backend URL (e.g., `https://zarvo-backend.onrender.com`).
    *   *Note: Ensure NO trailing slash is present if not needed, but typically standard URL is fine.*
    
5.  **Deploy**.
6.  **Copy the Netlify Site URL**.

## 3. Final Connection

1.  Go back to **Render Dashboard** -> **Environment**.
2.  Update `FRONTEND_URLS` value.
    *   Append your new Netlify URL.
    *   Example: `http://localhost:5173,https://my-zarvo-app.netlify.app`
3.  **Save Changes** (Render will restart the server).

## Troubleshooting

-   **CORS Errors**: Check the Browser Console. If you see CORS errors, verify `FRONTEND_URLS` in Render exactly matches your Netlify URL (including https://).
-   **API Errors**: Check the Network Tab. If API calls go to `localhost`, verify `VITE_API_BASE` is set in Netlify.
-   **Page Not Found on Refresh**: This is handled by the `netlify.toml` file included in the project. It redirects all routes to `index.html`.
