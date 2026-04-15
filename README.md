# TruckFlow
# TruckFlow Backend – Server-side Components

## Team Members
- Prosper Munachimso Obiezue – 3126619
- Vitor Lopes – 3143310
- Chibuike Nwoke – 3142395 

## Project Description
TruckFlow is a web-based logistics platform that connects clients needing goods transport with truck owners/transporters. This backend provides RESTful APIs for user authentication, booking management, quotes, labour requests, invoices, and ratings.

## Technologies
- Node.js + Express.js
- MongoDB (Mongoose ODM)
- JWT for authentication (HTTP‑only cookies)
- Session management with express‑session

## Implemented CRUD Operations for Bookings
| Operation | HTTP Method | Endpoint | Description |
|-----------|-------------|----------|-------------|
| Create    | POST        | /api/bookings | Create a new booking (client only) |
| Read      | GET         | /api/bookings | Get all bookings for the logged-in user |
| Read (single) | GET    | /api/bookings/:id | Get a single booking |
| Update    | PUT         | /api/bookings/:id | Update a pending booking (client only) |
| Delete    | DELETE      | /api/bookings/:id | Delete a pending booking (client only) |

## API Documentation

### Authentication
| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| /api/users/register | POST | Register new user | `{name, email, password, role, ...}` |
| /api/users/login | POST | Login, sets cookie | `{email, password}` |
| /api/users/logout | POST | Logout, clears cookie | – |
| /api/users/profile | GET | Get logged-in user profile | – |

### Bookings (full CRUD)
See table above.

## Session Usage
- The server uses `express-session` to store per‑user data.
- When a user views a booking (`GET /api/bookings/:id`), the booking ID is stored in `req.session.recentBookings`.
- The last **5** viewed bookings are kept and can be retrieved via `GET /api/users/recent`.
- This demonstrates active use of server‑side sessions beyond simple cookie authentication.

### Quotes
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/quotes | POST | Transporter creates a quote |
| /api/quotes/:id/accept | PUT | Client accepts a quote |
| /api/quotes | GET | List quotes for user |

### Labour Requests
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/labour | POST | Client creates labour request |
| /api/labour | GET | List labour requests |
| /api/labour/:id/assign | PUT | Labourer accepts assignment |

### Invoices
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/invoices | POST | Generate invoice for confirmed booking |
| /api/invoices | GET | List client invoices |
| /api/invoices/:id/pay | PUT | Pay invoice |

### Ratings
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/ratings | POST | Submit rating |
| /api/ratings/user/:userId | GET | Get ratings for a user |

## Deployment
Live API URL: `https://truckflow.onrender.com`

## Division of Labour
- Prosper: User authentication, booking CRUD, database models (40%)
- Vitor: Quotes, labour requests, invoice generation (30%)
- Chibuike: Ratings, middleware, deployment, README (30%)

## Setup Instructions (Local)
1. Run `npm install`
2. Create `.env` file (see `.env.example`)
3. Run `npm run dev`
4. Use Bruno/Postman with base URL `http://localhost:9001`
You can also use render to run it.

## Changes from Assignment 1 (Project Proposal)

The following changes have been made from the original plan described in Assignment 1:

1. **Real‑time GPS tracking** – Not implemented in this server‑side iteration. The proposal included live truck tracking, but this feature was deferred to a future frontend/WebSocket implementation due to time constraints and scope of Assignment 2.

2. **Labourer matching algorithm** – Simplified from “intelligent matching based on location/skills” to a manual acceptance system where labourers directly assign themselves to pending requests (`PUT /api/labour/:id/assign`). This still satisfies the core requirement of connecting clients with labourers.

3. **Payment gateway integration** – Stripe/PayPal not implemented; payment is simulated by updating invoice status to “paid”. This was simplified for the backend scope.

All other core functionalities (user auth, booking CRUD, quotes, invoices, ratings) remain as originally proposed.