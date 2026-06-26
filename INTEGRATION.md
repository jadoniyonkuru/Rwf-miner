# RWF Miner — Frontend Integration Guide

## Base URLs

| Environment | API Base | Swagger Docs |
|---|---|---|
| Production | `https://rwf-miner.onrender.com/api` | `https://rwf-miner.onrender.com/docs` |
| Local | `http://localhost:3000/api` | `http://localhost:3000/docs` |

---

## Standard Response Format

Every response follows this structure:

```json
// Success
{ "success": true, "data": { ... }, "message": "..." }

// Error
{ "success": false, "statusCode": 400, "message": "Error description", "path": "/api/...", "timestamp": "..." }
```

---

## Authentication

All protected routes require this header:
```
Authorization: Bearer <accessToken>
```

### Token Lifecycle
- `accessToken` expires in **15 minutes** — store in memory (not localStorage)
- `refreshToken` expires in **7 days** — store in localStorage or httpOnly cookie
- When `accessToken` expires → call `POST /auth/refresh-token` to get a new one
- On logout → call `POST /auth/logout` to invalidate the refresh token

---

## Auth Endpoints

### Register
```
POST /auth/register
```
Body:
```json
{ "email": "user@example.com", "password": "Password123!" }
```
Response (201):
```json
{
  "data": {
    "email": "us•••@example.com",
    "verificationCode": "123456"
  }
}
```
> `verificationCode` is only in the response when `TESTING_MODE=true` (current testing setup).
> In production, the code is sent to email only.

---

### Verify Email
```
POST /auth/verify-email
```
Body:
```json
{ "email": "user@example.com", "code": "123456" }
```
> Use the code from the registration response (TESTING_MODE) or from email.
> Do NOT register multiple times — each registration generates a new code, old ones are invalid.

---

### Resend Verification Code
```
POST /auth/resend-verification
```
Body:
```json
{ "email": "user@example.com" }
```
> Call this if the user didn't receive or lost the code. Always use the LATEST code sent.

---

### Login
```
POST /auth/login
```
Body:
```json
{ "email": "user@example.com", "password": "Password123!" }
```
Response (200):
```json
{
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "uuid-v4-token",
    "user": {
      "id": "cuid",
      "email": "us•••@example.com",
      "role": "USER",
      "isPinSet": false
    }
  }
}
```
> Store `accessToken` in memory, `refreshToken` in localStorage.
> Check `isPinSet` — if `false`, prompt user to set up PIN before withdrawing.

---

### Refresh Token
```
POST /auth/refresh-token
```
Body:
```json
{ "refreshToken": "uuid-v4-token" }
```
> Call automatically when you get a 401. Returns new `accessToken` + `refreshToken`.

---

### Logout
```
POST /auth/logout
```
Body:
```json
{ "refreshToken": "uuid-v4-token" }
```

---

### Forgot Password
```
POST /auth/forgot-password
```
Body:
```json
{ "email": "user@example.com" }
```
> Always returns 200 (even if email doesn't exist — security).

---

### Reset Password
```
POST /auth/reset-password
```
Body:
```json
{ "token": "uuid-from-email", "newPassword": "NewPassword123!" }
```

---

### Change Password (Auth required)
```
PUT /auth/change-password
```
Body:
```json
{ "currentPassword": "OldPassword123!", "newPassword": "NewPassword123!" }
```

---

### Setup Withdrawal PIN (Auth required)
```
POST /auth/pin/setup
```
Body:
```json
{ "pin": "123456", "confirmPin": "123456" }
```
> Call once after first login. PIN is 6 digits.

---

### Verify PIN (Auth required)
```
POST /auth/pin/verify
```
Body:
```json
{ "pin": "123456" }
```

---

### Change PIN (Auth required)
```
PUT /auth/pin/change
```
Body:
```json
{ "currentPin": "123456", "newPin": "654321" }
```

---

### Request PIN Reset (Auth required)
```
POST /auth/pin/reset-request
```
> Sends reset link to user's email.

---

### Reset PIN
```
POST /auth/pin/reset
```
Body:
```json
{ "token": "uuid-from-email", "newPin": "111222" }
```

---

## Profile Endpoints (Auth required)

### Get My Profile
```
GET /users/me
```
Response:
```json
{
  "data": {
    "id": "cuid",
    "email": "us•••@example.com",
    "role": "USER",
    "isVerified": true,
    "isPinSet": true,
    "createdAt": "2026-06-22T00:00:00.000Z"
  }
}
```

---

### Update Profile
```
PUT /users/me
```
Body:
```json
{ "email": "newemail@example.com" }
```

---

### Delete Account
```
DELETE /users/me
```

---

## Dashboard (Auth required)

### Get Account Stats
```
GET /dashboard/stats
```
Response:
```json
{
  "data": {
    "balance": 152.5,
    "totalDeposited": 200,
    "totalWithdrawn": 50,
    "totalEarned": 2.5,
    "pendingDeposits": 1,
    "depositCount": 2,
    "withdrawalCount": 1,
    "earningCount": 5,
    "currency": "USDT"
  }
}
```

---

## Mining Endpoints

### Get Mining Rates (No auth)
```
GET /mining/rates
```
Response:
```json
{
  "data": {
    "dailyRate": 0.005,
    "dailyRatePercent": "0.50%",
    "weeklyRatePercent": "3.50%",
    "monthlyRatePercent": "15.00%",
    "minDeposit": 10,
    "currency": "USDT"
  }
}
```

---

### Calculate Profit (No auth)
```
POST /mining/calculate
```
Body:
```json
{ "amount": 500 }
```
Response:
```json
{
  "data": {
    "investment": 500,
    "dailyRate": "0.50%",
    "daily": 2.5,
    "weekly": 17.5,
    "monthly": 75,
    "currency": "USDT"
  }
}
```

---

### Get My Earnings (Auth required)
```
GET /mining/earnings
```

---

## Deposits (Auth required)

### Get Deposit Address
```
GET /deposits/address
```
Response:
```json
{
  "data": {
    "address": "TELEXuLxzbW6ejKTL6qKJE48UA3LQDaBo",
    "network": "TRC-20",
    "currency": "USDT"
  }
}
```

---

### Get QR Code
```
GET /deposits/qr
```
Response:
```json
{ "data": { "qr": "data:image/png;base64,...", "isCustom": false } }
```

---

### Upload Custom QR
```
POST /deposits/qr
```
Body:
```json
{ "qr": "data:image/png;base64,..." }
```

---

### Submit Deposit
```
POST /deposits
```
Body:
```json
{ "amount": 100, "txHash": "abc123txhashhere" }
```
> `txHash` is the TRC-20 transaction ID from the USDT transfer.

---

### Get Deposit History
```
GET /deposits?page=1&limit=10
```

---

### Get Single Deposit
```
GET /deposits/:id
```

---

### Cancel Deposit
```
DELETE /deposits/:id
```
> Only works if status is `PENDING`.

---

## Withdrawals (Auth required)

### Submit Withdrawal
```
POST /withdrawals
```
Body:
```json
{ "amount": 50, "address": "TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", "pin": "123456" }
```
> Minimum withdrawal: 10 USDT. PIN is required.

---

### Get Withdrawal History
```
GET /withdrawals?page=1&limit=10
```

---

### Get Single Withdrawal
```
GET /withdrawals/:id
```

---

### Cancel Withdrawal
```
DELETE /withdrawals/:id
```
> Only works if status is `PENDING`.

---

## Transactions (Auth required)

### Public Live Feed (No auth)
```
GET /transactions/feed
```
> Shows latest 20 transactions with masked emails. Good for homepage ticker.

---

### My Transaction History
```
GET /transactions?page=1&limit=10
```

---

### Single Transaction
```
GET /transactions/:id
```

---

## Notifications (Auth required)

### Get All Notifications
```
GET /notifications
```
Response:
```json
{
  "data": {
    "notifications": [
      { "id": "cuid", "title": "Deposit Confirmed", "message": "Your deposit of 100 USDT has been confirmed.", "type": "SUCCESS", "isRead": false, "createdAt": "..." }
    ],
    "unreadCount": 1
  }
}
```

---

### Mark All as Read
```
PUT /notifications/read-all
```

---

### Mark One as Read
```
PUT /notifications/:id/read
```

---

### Delete Notification
```
DELETE /notifications/:id
```

---

## Support (No auth)

### Get Support Links
```
GET /support/links
```
Response:
```json
{ "data": { "whatsapp": "https://wa.me/250xxxxxxxxx", "telegram": "https://t.me/rwfminer" } }
```

---

## Admin Endpoints (ADMIN role required)

> All admin endpoints require `Authorization: Bearer <adminAccessToken>`.
> The logged-in user must have `role: "ADMIN"` in the database.

---

### Admin Dashboard
```
GET /admin/dashboard
```

---

### Admin — Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | List all users (`?page=1&limit=20&search=email`) |
| GET | `/admin/users/:id` | Get user detail |
| PUT | `/admin/users/:id` | Update user (email, role, verified, suspended) |
| DELETE | `/admin/users/:id` | Delete user permanently |
| POST | `/admin/users/:id/suspend` | Suspend account |
| POST | `/admin/users/:id/activate` | Re-activate account |
| POST | `/admin/users/:id/reset-password` | Send password reset email |
| POST | `/admin/users/:id/reset-pin` | Clear user PIN |
| POST | `/admin/users/:id/credit` | Credit balance manually |
| GET | `/admin/users/:id/activity` | User transaction history |
| GET | `/admin/users/:id/deposits` | User deposit list |
| GET | `/admin/users/:id/withdrawals` | User withdrawal list |

---

### Admin — Deposits

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/deposits` | List all deposits (`?status=PENDING`) |
| GET | `/admin/deposits/:id` | Get single deposit |
| PUT | `/admin/deposits/:id/status` | Approve or reject deposit |
| POST | `/admin/deposits/bulk-approve` | Bulk approve deposits |

Approve body:
```json
{ "status": "CONFIRMED" }
```
Reject body:
```json
{ "status": "REJECTED", "notes": "Invalid transaction" }
```

---

### Admin — Withdrawals

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/withdrawals` | List all withdrawals (`?status=PENDING`) |
| GET | `/admin/withdrawals/:id` | Get single withdrawal |
| PUT | `/admin/withdrawals/:id/status` | Complete or reject withdrawal |
| POST | `/admin/withdrawals/bulk-approve` | Bulk approve withdrawals |

Complete body:
```json
{ "status": "COMPLETED" }
```
Reject body:
```json
{ "status": "REJECTED", "notes": "Address invalid" }
```

---

## Frontend Flow Guide

### New User Flow
1. `POST /auth/register` → get `verificationCode` from response (TESTING_MODE)
2. `POST /auth/verify-email` → with that code
3. `POST /auth/login` → get `accessToken` + `refreshToken`
4. Store tokens → redirect to dashboard
5. `POST /auth/pin/setup` → prompt user if `isPinSet === false`

### Returning User Flow
1. `POST /auth/login` → get tokens
2. On 401 → `POST /auth/refresh-token` → retry request
3. On logout → `POST /auth/logout` → clear tokens

### Deposit Flow
1. `GET /deposits/address` → show deposit address + QR
2. User sends USDT on TRC-20 network
3. `POST /deposits` → submit amount + txHash
4. Status starts as `PENDING` → admin confirms → becomes `CONFIRMED`
5. User gets notification when confirmed

### Withdrawal Flow
1. Check `GET /dashboard/stats` → confirm balance is enough
2. `POST /auth/pin/verify` → verify PIN first (optional pre-check)
3. `POST /withdrawals` → submit amount + address + PIN
4. Status starts as `PENDING` → admin completes → becomes `COMPLETED`

---

## Status Enums

| Entity | Statuses |
|---|---|
| Deposit | `PENDING` → `CONFIRMED` or `REJECTED` |
| Withdrawal | `PENDING` → `COMPLETED` or `REJECTED` |
| Notification type | `SUCCESS`, `ERROR`, `INFO`, `WARNING` |
| Transaction type | `DEPOSIT`, `WITHDRAWAL`, `MINING_EARNING` |
| User role | `USER`, `ADMIN` |

---

## Testing Notes

- `TESTING_MODE=true` is active — `verificationCode` is returned in register response
- Use one email per test — registering the same email twice invalidates the first OTP
- Admin account: set `role = "ADMIN"` in database for a test user via Neon SQL:
  ```sql
  UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
  ```
