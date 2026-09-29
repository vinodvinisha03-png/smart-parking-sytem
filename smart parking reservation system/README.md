# Smart Parking Reservation System

A full-stack platform where users browse parking locations, check live slot availability, reserve a slot, pay through a simulated checkout, and manage/cancel their reservations. Admins manage parking locations and view all reservations and revenue.

**Stack:** HTML/CSS/JavaScript (frontend) · Node.js + Express (backend) · MongoDB Atlas (database)

## 1. Install dependencies

## 2. Set up your environment variables
1. Copy `.env.example` to a new file named exactly `.env`
2. Fill in:
   - `MONGODB_URI` — your MongoDB Atlas connection string, with your real password, and a database name before the `?`, e.g. `.../smartparking?retryWrites=true...`
   - `JWT_SECRET` — any long random string
   - `ADMIN_SIGNUP_CODE` — any secret word/phrase of your choice (e.g. `parking-admin-2026`). Anyone who enters this code on the signup page is registered as an **admin**; everyone else is a regular **user**.
   - `PORT` — leave as `3000`

**Never commit `.env` to GitHub.**

## 3. Run the server
Open **http://localhost:3000**.

## 4. How to get an admin account
Go to the signup page and fill the form as normal, but also enter the `ADMIN_SIGNUP_CODE` you set in `.env` into the "Admin code" field. That account will land on the Admin Dashboard instead of the regular Locations page. Create at least one admin first (e.g. for yourself) so you can add parking locations — otherwise the Locations page will be empty for everyone.

## 5. Project structure

## 6. How the core flow works
1. **Admin** signs up with the admin code → adds parking locations (name, address, total slots, price/hour)
2. **User** signs up normally → browses **Locations** → clicks "Reserve & Pay" on one with open slots
3. **Checkout page** → enters vehicle number and time window (amount is calculated live from the hourly rate) → enters card details (simulated — no real payment gateway, nothing is charged or stored) → "Pay" → shows a processing animation → creates the reservation and decrements available slots → shows a receipt with a transaction ID
4. **My Reservations** → view all bookings, cancel an active one (slot is freed and the "payment" is marked refunded)
5. **Admin Dashboard** → see every reservation across all users, with payment status and total revenue; edit or delete locations

> Note on payment: this project uses a **simulated checkout** — the card form looks and behaves like a real one (formatting, validation, processing delay, transaction ID) but no real payment gateway is contacted and no card data is stored beyond the last 4 digits shown on the receipt.

## 7. Working as a team on one laptop
Before each person's turn:
Then code, then:

## Troubleshooting
- **"MongoDB connection error"** → check `MONGODB_URI` in `.env` and Atlas Network Access allows `0.0.0.0/0`
- **Signup doesn't make me admin** → double check the code you typed exactly matches `ADMIN_SIGNUP_CODE` in `.env`
- **Port already in use** → another `npm start` is likely still running in another terminal tab; stop it or change `PORT`
