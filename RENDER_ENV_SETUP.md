# Render Environment Variables Setup

## 🚀 How to Add Environment Variables to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service: **schooldekho-zodb**
3. Click on **"Environment"** in the left sidebar
4. Click **"Add Environment Variable"** for each variable below
5. After adding all variables, Render will automatically redeploy

---

## 📋 Required Environment Variables

Copy and paste these into your Render environment variables:

### Server Configuration
```
PORT=5000
```

### CORS Configuration (IMPORTANT!)
```
FRONTEND_URLS=https://schooldekho.netlify.app,http://localhost:8080
```

### JWT Secret
```
JWT_SECRET=Aadarsh123
```

### MongoDB Connection
```
MONGO_URI=mongodb+srv://aadarshgolucky:A%40Wrpcp3.%40737xx@cluster0.oss7hwd.mongodb.net/events?retryWrites=true&w=majority&appName=Cluster0
```

### SMTP Email Configuration
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=aadarshgolucky@gmail.com
SMTP_PASS=mulp pwbn puqc xtcj
```
**Note:** Remove quotes from SMTP_PASS in Render

### Admin Credentials
```
ADMIN_EMAIL=aadarshgolucky@gmail.com
ADMIN_PASSWORD=Aadarsh@123
```

### Cloudinary Configuration
```
CLOUDINARY_URL=cloudinary://611388377375713:gEzrIzb84NvNqdLk5T8X9Nxr6sw@dvg3aiqmb
CLOUDINARY_CLOUD_NAME=dvg3aiqmb
CLOUDINARY_API_KEY=611388377375713
CLOUDINARY_API_SECRET=gEzrIzb84NvNqdLk5T8X9Nxr6sw
```

---

## ⚠️ Important Notes

1. **FRONTEND_URLS** is the most critical for fixing CORS errors
2. Remove quotes from `SMTP_PASS` when adding to Render (just use: `mulp pwbn puqc xtcj`)
3. After adding all variables, Render will automatically redeploy your service
4. Wait 2-3 minutes for the deployment to complete
5. Check the Render logs to ensure the server started successfully

---

## ✅ Verification

After deployment, you should see in Render logs:
```
Backend running on http://localhost:5000
Connected to MongoDB
CORS allowed origins: https://schooldekho.netlify.app, http://localhost:8080
```

---

## 🔗 URLs

- **Backend (Render):** https://schooldekho-zodb.onrender.com
- **Frontend (Netlify):** https://schooldekho.netlify.app
