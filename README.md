# Members Only

A role-based messaging board where what you see depends on who you are. Guests can read posts but see no author or timestamp. Members unlock that metadata after verifying their membership. Admins can delete any post.

Built as a full-stack Node/Express application with PostgreSQL, session-based authentication, and server-side rendering via EJS.

![Members Only guest view](public/Members%20Only%20Screengrab.png)

## Features

| Role | Read messages | See author & timestamp | Post messages | Delete messages |
|------|:---:|:---:|:---:|:---:|
| Guest | Yes | No | No | No |
| Member | Yes | Yes | Yes | No |
| Admin | Yes | Yes | Yes | Yes |

- **Secure authentication** — passwords hashed with bcrypt; sessions managed via express-session and Passport.js (LocalStrategy)
- **Role-based access control** — three distinct permission tiers enforced server-side
- **Input validation** — sign-up form validated with express-validator, including a custom password-confirmation rule
- **Accessible UI** — skip-to-content link, semantic HTML, and `aria-label` attributes on interactive elements

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** PostgreSQL (via `pg`)
- **Auth:** Passport.js · express-session · bcryptjs
- **Validation:** express-validator
- **Templating:** EJS
- **Deployment:** Configured for environment-variable–based port and session secrets

## Project Structure

```
members_only/
├── app.js                  # Express app setup and server entry point
├── config/
│   └── passport.js         # Passport LocalStrategy, serialize/deserialize
├── db/
│   └── pool.js             # PostgreSQL connection pool
├── routes/
│   ├── authRouter.js       # Sign-up, log-in, log-out, membership confirmation
│   └── messagesRouter.js   # Message feed, create, delete
├── views/                  # EJS templates
└── public/                 # Static assets (CSS)
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Database Setup

Create the required tables in your PostgreSQL database:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  membership_status BOOLEAN DEFAULT false,
  admin BOOLEAN DEFAULT false
);

CREATE TABLE messages (
  message_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255),
  text TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Environment Variables

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://user:password@localhost:5432/members_only
SESSION_SECRET=your_session_secret
PORT=3000
```

### Install & Run

```bash
npm install
npm start
```

The app will be available at `http://localhost:3000`.

## How Membership Works

After signing up, users are prompted to enter a confirmation number to unlock full member access. Members can then see the author and timestamp on every post. Admin accounts are designated at registration and have the additional ability to delete messages from the board.
