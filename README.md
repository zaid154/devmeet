# 🔥 DevMeet — Dating & Networking for Developers & Engineers

[![Live Demo](https://img.shields.io/badge/Live_App-devmeet--pro.vercel.app-E11D48?style=for-the-badge&logo=vercel)](https://devmeet-pro.vercel.app/)
[![Author Portfolio](https://img.shields.io/badge/Portfolio-zaid--pro.vercel.app-000000?style=for-the-badge&logo=vercel)](https://zaid-pro.vercel.app/)

> **Live Application**: [https://devmeet-pro.vercel.app](https://devmeet-pro.vercel.app)

> **It starts with a swipe.™**  
> DevMeet is a premier full-stack MERN dating, matchmaking, and networking platform built specifically for software engineers, developers, and tech innovators.

---

## 👨‍💻 Developer & Author Information

* **Developer Name**: Mohd Zaid  
* **Contact Email**: [zaidm1323@gmail.com](mailto:zaidm1323@gmail.com)  
* **Portfolio Website**: [zaid-pro.vercel.app](https://zaid-pro.vercel.app/)  
* **GitHub Profile**: [github.com/zaid154](https://github.com/zaid154)  
* **LinkedIn Profile**: [linkedin.com/in/mohd-zaid-794090231/](https://www.linkedin.com/in/mohd-zaid-794090231/)

---

## ✨ Features & Capabilities

### 💖 Dating & Matchmaking Engine
- **Tinder-Style Swiping Deck**: Swipe left to Pass (`✕`), swipe right to Like (`❤️`), or SuperLike (`⭐`) with smooth touch gestures & keyboard shortcuts (`ArrowLeft`, `ArrowRight`, `Space`).
- **Interactive Match Screen**: Real-time mutual match celebration modal with instant direct chat trigger.
- **Radar & Explore Categories**: Find partners by relationship intent (*Long-term, Short-term fun, New friends, Coffee date, Gamers & Tech*).
- **Global Search & Filter**: Search developers by tech stack, skills, bio keywords, and location.

### 💬 Real-Time Chat & Communications
- **Socket.io Live Messaging**: Real-time direct chat with online status indicators & typing animations.
- **Rich Media Sharing**: Send curated GIF reactions, developer emojis, and code snippet cards.
- **Audio & Video Calling**: Built-in 1-on-1 WebRTC audio and video calling with live connection timers.

### 🛡️ Trust, Safety & Admin Suite
- **Photo Verification**: Automated and manual selfie photo verification badge system.
- **Full Admin Control Panel (`/admin`)**:
  - Live analytics & KPIs (Daily Active Users, match rates, subscription MRR).
  - User management, ban/unban, warning, and verification approvals.
  - Media & CMS Manager for profile pictures and global announcement banners.
  - Audit activity logs and moderation reports.

### 📱 100% Responsive Design
- Fully responsive across **Mobile (320px+)**, **Tablet (768px+)**, **Laptop (1080p / 1366x768)**, and **4K Desktops**.
- Zero horizontal overflow (`overflow-x: hidden`), fluid typography, and viewport-calibrated cards.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, Axios, Emoji Picker |
| **Backend** | Node.js, Express.js, Socket.io, Mongoose (MongoDB ODM) |
| **Authentication** | JWT (JSON Web Tokens) with HTTP-only Cookies, bcrypt |
| **Media & Storage** | Cloudinary API, Multer |
| **DevOps & Tools** | Concurrently, Nodemon, Git |

---

## 🚀 Quick Start & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/zaid154/Devmeet.git
cd Devmeet
```

### 2️⃣ Install Dependencies
Install `server` and `client` dependencies in their respective folders:
```bash
cd server && npm install
cd ../client && npm install
```

### 3️⃣ Environment Configuration
Create a `.env` file in the `server/` directory:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/devmeet?retryWrites=true&w=majority
JWT_PVT_KEY=your_super_secret_jwt_key
SALT_ROUND=10
ADMIN_EMAIL=admin@devmeet.com
ADMIN_PASSWORD=AdminPassword123!
```

Create a `.env` file in the `client/` directory:
```env
VITE_API_URL=http://localhost:3000
```

### 4️⃣ Start Development Servers
Run Backend (`3000`) and Frontend (`5173`) in separate terminals:
```bash
# Terminal 1 (Backend)
cd server && npm run dev

# Terminal 2 (Frontend)
cd client && npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:5173/admin](http://localhost:5173/admin)

---

## 📄 License & Copyright

&copy; 2026 **DevMeet Inc.** Created with ❤️ by **Mohd Zaid**. All rights reserved.
