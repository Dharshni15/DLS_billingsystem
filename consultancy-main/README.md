# SellSmart Billing (MERN + Excel Reports)

## Run locally

Backend:
1. cd backend
2. Copy `.env.example` to `.env` and adjust if needed
3. npm install
4. npm run dev

Frontend:
1. cd frontend
2. npm install
3. npm run dev

Open http://localhost:5173

## Features (MVP)
- React POS screen with simple cart
- Express API with MongoDB connection
- Excel report export using exceljs at `GET /api/reports/sample-excel`

## Configuration
- Backend port: 5001 (env: `PORT`)
- Frontend origin for CORS: `FRONTEND_ORIGIN` (default http://localhost:5173)
- MongoDB: `MONGODB_URI`
