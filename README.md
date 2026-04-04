<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Shivane Water Can Supply App

This application provides a platform for managing water can supplies, featuring a React frontend and a Node.js/Express backend with Socket.IO integration and MySQL database.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **MySQL Server**

## Local Setup

### 1. Database Configuration

1.  Ensure your MySQL server is running.
2.  Create a database named `water_supply`:
    ```sql
    CREATE DATABASE water_supply;
    ```
3.  The application will automatically create the necessary tables (`users`, `orders`, etc.) when it first connects to the database.

### 2. Environment Variables

1.  Copy `.env.example` to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Update the values in `.env` to match your local environment:
    - `DB_HOST`: Your MySQL host (default: `localhost`)
    - `DB_USER`: Your MySQL user (default: `root`)
    - `DB_PASSWORD`: Your MySQL password
    - `DB_NAME`: `water_supply`
    - `GEMINI_API_KEY`: Your Google Gemini API Key
    - `JWT_SECRET`: A secret key for authentication

### 3. Install Dependencies

```bash
npm install
```

## Running the Application

### Development Mode

To run both the backend and the frontend (via Vite dev middleware) simultaneously:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Mode

1.  Build the frontend:
    ```bash
    npm run build
    ```
2.  Start the server:
    ```bash
    npm run start
    ```
    (Ensure `NODE_ENV` is set to `production` for serving the built files).
