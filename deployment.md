# Deployment Guide

Follow these steps to deploy your Shivane Water Can Supply project to a production server.

## Prerequisites

- Node.js installed on the server.
- Access to a production database (the app uses SQLite by default).
- A Gemini API Key.

## Deployment Steps

### 1. Build the Application
Before deploying, you need to build the frontend assets:
```bash
npm install
npm run build
```

### 2. Run Database Migrations
If there are schema changes, run the migration script:
```bash
node migrateDb.mjs
```

### 3. Configure Environment Variables
Create a `.env` file on your server (or set environment variables in your hosting provider's dashboard):
```env
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your_api_key_here
JWT_SECRET=your_secure_secret_here
# Email settings
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 3. Start the Server
Run the production server using the start script:
```bash
npm start
```

## Recommended Platforms

### Railway Deployment (Quick Start)

1. **Connect your GitHub Repository** to Railway.
2. Railway will automatically detect the `package.json` and use:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. **Environment Variables**: Add your `GEMINI_API_KEY`, `JWT_SECRET`, etc., in the Railway dashboard.
4. **SQLite Persistence**: 
   - Add a **Volume** in Railway (e.g., mount to `/data`).
   - Update your environment variable to point the database there if needed, or rely on the default `./database.sqlite` (note: without a volume, data will reset on every deploy).
   - To use a volume, you can set an environment variable like `DB_PATH=/data/database.sqlite` and update the code to use it.

### VPS (DigitalOcean / AWS / Linode)
1. SSH into your server.
2. Clone the repository.
3. Install dependencies and build.
4. Use a process manager like **PM2** to keep the app running:
   ```bash
   pm2 start npm --name "water-can-supply" -- start
   ```
