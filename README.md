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

### 2. Backend Setup (Required)
To use the application, you need to run the backend server:

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
Make sure your backend is running to access real data and functionality.

## 🛠 Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Node.js, Express, PostgreSQL
- **Architecture:** Monorepo-style structure
