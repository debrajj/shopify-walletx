# Shopify Wallet & Coins App

A production-ready **Custom Shopify App** that allows customers to partially pay using **Wallet Coins + Normal Payment**.

## 🚀 Quick Start (Local Development)

To run this application locally on your machine:

### 1. Frontend Setup
This starts the Admin UI (React + Vite).

1.  Open your terminal in the project root.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5173` in your browser.

> **Note:** The frontend runs in **Mock Mode** by default if the backend is not running. You will see simulated data.

### 2. Backend Setup (Optional)
If you want to connect to a real database and API:

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install backend dependencies:
    ```bash
    npm install
    ```
3.  Configure `.env` file (copy from example):
    ```bash
    cp .env.example .env
    # Edit .env with your PostgreSQL credentials
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```
    The backend runs on `http://localhost:3000`.

### 3. Connecting Frontend to Backend
The frontend is configured to proxy requests to `http://localhost:3000` via `vite.config.ts`.
If your backend is running, the frontend will automatically try to fetch real data. If the connection fails, it falls back to mock data.

## 🛠 Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Node.js, Express, PostgreSQL
- **Architecture:** Monorepo-style structure
