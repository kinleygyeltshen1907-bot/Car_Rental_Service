# Car Rental Service (CRS)

React + Vite frontend, Node.js + Express API, and MySQL database.

## Requirements
- Node.js 20+
- MySQL 8+
- VS Code

## 1. Create the database
Open MySQL Workbench or the MySQL terminal and run `database/schema.sql`.
This creates the `car_rental_service` database and its tables.

## 2. Configure the backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and update your MySQL username/password and JWT secret.

Run the API:
```bash
npm run dev
```
The API runs at `http://localhost:5000`.

## 3. Configure and run the frontend
Open a second VS Code terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## 4. Create your first administrator
Register a normal account through the website. Then promote it using MySQL:
```sql
USE car_rental_service;
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```
Log out and log back in. The Admin Dashboard will now be available.

## Demo payment behaviour
The project records payments as `pending` or `paid` and provides an admin action to mark a payment as paid. It does **not** connect to a real payment gateway. Do not collect or store card numbers. Integrate a supported payment provider separately before production deployment.

## Project structure
```
car-rental-service/
├── database/schema.sql
├── backend/
│   ├── src/
│   │   ├── middleware/auth.js
│   │   ├── routes/auth.js
│   │   ├── routes/cars.js
│   │   ├── routes/bookings.js
│   │   ├── routes/admin.js
│   │   ├── db.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── index.html
    ├── src/App.jsx
    ├── src/main.jsx
    ├── src/style.css
    └── package.json
```

## Notes
- Booking dates are checked against overlapping confirmed/pending bookings on the server.
- The backend recalculates rental totals; it does not trust a total sent by the browser.
- Passwords are hashed with bcrypt.
- JWT authentication and role checks protect API endpoints.
- This is a development foundation. Before real deployment, add HTTPS, rate limiting, email verification, backups, audit logging, stronger validation, and a real payment gateway.
