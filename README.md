## CommunityConnect
This is a project for unit SIT725.


## Authentication Overview

This project supports two types of user authentication:

1. **Email/Password Authentication with Email Verification**
2. **Google OAuth2.0 Login (via Passport.js)**

---

### 1. Email/Password Registration with Verification

#### Registration Endpoint

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Behavior:**

* Stores the user in MongoDB (with hashed password)
* Generates a unique email verification token
* Sends a verification email to the user
* User must verify the email before logging in

#### Email Verification

```http
GET /api/auth/verify/:token
```

* The token is emailed during registration.
* Verifies the user and marks their `isVerified` flag as `true`.
* Redirects to the login page on success.

#### Login Endpoint

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Behavior:**

* Checks for verified email
* Validates password
* Responds with a JWT token if successful

---

### 2. Google OAuth 2.0 Authentication

Uses `passport-google-oauth20` strategy.

#### Google Login Initiation

```http
GET /api/auth/google
```

Redirects the user to Google's login page.

#### Google OAuth Callback

```http
GET /api/auth/google/callback
```

* If user exists, logs them in.
* If user does not exist, creates a new record.
* On success, redirects to: `/pages/landing.html`

---

## 🛠 Setup Instructions

### Environment Variables Required

Create a `.env` file with the following:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

JWT_SECRET=your_jwt_secret
SESSION_SECRET=some_secure_random_string

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 🚀 Running the Server

```bash
npm install
node server.js
```

---
## 📊 Frontend Figma Clickable design

![image](https://github.com/user-attachments/assets/0eac06c6-0104-421b-9625-77c3e9421049)


## 📊 Backend Architecture Diagram

<img width="849" alt="image" src="https://github.com/user-attachments/assets/dc355bec-1602-41c9-8c1e-d58c7baaa5b2" />
