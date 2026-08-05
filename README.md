# DevMeetup Backend API

DevMeetup is a Node.js, Express, and MongoDB backend application for developer networking, user authentication, profile management, and connection requests.

**Author / Creator:** Mohd Zaid

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens) & HTTP-only Cookies
- **Validation:** Validator & Mongoose Schema Validation
- **Encryption:** bcrypt

---

## 🚀 Environment Variables (`.env`)

Create a `.env` file in the root directory with the following configuration:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
SALT_ROUND=10
```

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/signup` | ❌ | Create a new user account |
| `POST` | `/login` | ❌ | Authenticate user & receive JWT cookie |
| `POST` | `/logout` | ────────── | Logout user & clear token cookie |
| `GET` | `/profile` | ────────── | Fetch logged-in user's profile details |
| `GET` | `/users/:id` | ❌ | Get user details by ID |
| `PATCH` | `/updateProfile` | ────────── | Update logged-in user's profile information |
| `DELETE` | `/users/:id` | ❌ | Delete a user by ID |
| `POST` | `/sendConnection/:toUserId/:status` | ────────── | Send connection request (`/sendConnection/:toUserId/:status`) |

---

## 🐞 Fixed Errors & Working Setup Summary

1. **`app.js`**: Re-structured cleanly with express middlewares, routes registration (`AuthRouter`, `ProfileRouter`, `RequestRouter`), and MongoDB connection.
2. **`src/utils/authToken.js`**: Fixed module path, JWT secret key, attached `req.user` & `req.userId`, and handles 401 unauthorized errors properly.
3. **`src/utils/validation.js`**: Fixed `validateUserUpdate` export and updated validation checks for user data.
4. **`src/router/auth.js`**: Corrected imports and validation error status handling.
5. **`src/router/profile.js`**: Fixed `userAuth` reference to `auth`, updated allowed update fields, and error handling.
6. **`src/router/request.js`**: Fully working `sendConnection` endpoint with status validation (`ignored`/`interested`), self-connection check, user existence check, and duplicate request check. Added `logout` endpoint.
7. **`src/model/connection.js`**: Fixed `Schema.Types.ObjectId` reference, added `toUserId`, `fromUserId`, and `status` enum.
