# ♿ SAHAJ — Accessibility Mapping Platform
### Vikshit Bharat 2047 · Pillar 6: Social Inclusion & Justice

> *Crowdsource and verify wheelchair-friendly public infrastructure across Indian cities.*

---

## 🎯 Mission

**SAHAJ** (Seamless Accessibility Hub for All Journey-makers) ek citizen-driven platform hai jo wheelchair users aur differently-abled citizens ke liye India ka sabse comprehensive accessibility map bana raha hai.

**Beneficiaries:** Wheelchair users · Differently-abled citizens · Elderly people · Women

**Vision:** Vikshit Bharat 2047 tak har public jagah accessible ho — SAHAJ us sapne ka naqsha hai.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 · CSS3 · Vanilla JS · Leaflet.js |
| Backend | Node.js · Express.js |
| Database | MongoDB Atlas (Cloud) |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| Deployment | Vercel (frontend + backend) |

---

## 📁 Project Structure

```
accessibility-map-app/
├── frontend/
│   ├── index.html          # Home page with hero + stats
│   ├── map.html            # Interactive Leaflet map
│   ├── add-location.html   # Report accessibility location
│   ├── dashboard.html      # City analytics dashboard
│   ├── login.html          # Authentication
│   ├── register.html       # User registration
│   ├── admin.html          # Admin panel
│   ├── css/
│   │   └── style.css       # Complete design system
│   └── js/
│       ├── auth.js         # Shared auth state + nav
│       ├── map.js          # Leaflet map + markers + voting
│       ├── addLocation.js  # Form + map picker + score calc
│       └── dashboard.js    # Analytics + city rankings
├── backend/
│   ├── server.js           # Express app entry point
│   ├── config/
│   │   └── db.js           # MongoDB Atlas connection
│   ├── models/
│   │   ├── User.js         # User schema (roles, banning)
│   │   └── Location.js     # Location schema (scoring, voting)
│   ├── controllers/
│   │   ├── authController.js      # Register/Login/Users
│   │   └── locationController.js  # CRUD + vote + dashboard
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── locationRoutes.js
│   └── middleware/
│       └── authMiddleware.js      # JWT protect + roles
├── uploads/                # Uploaded photos stored here
├── .env.example            # Environment variables template
├── package.json
├── vercel.json             # Vercel deployment config
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd accessibility-map-app
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/sahajDB
JWT_SECRET=your-super-secret-key-here
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
```

### 3. Set Up MongoDB Atlas (Free)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0 Sandbox)
3. Create a database user with password
4. Whitelist your IP (or `0.0.0.0/0` for development)
5. Copy connection string → paste in `.env` as `MONGO_URI`
6. Replace `<password>` with your actual password

### 4. Run the Backend

```bash
npm run dev
# or
npm start
```

Backend runs at: `http://localhost:5000`

Health check: `http://localhost:5000/api/health`

### 5. Serve the Frontend

Use VS Code Live Server or any static server:

```bash
# Using npx serve
npx serve frontend -p 5500

# Or using Python
cd frontend && python -m http.server 5500
```

Frontend at: `http://localhost:5500`

---

## 🔌 API Reference

### Auth Endpoints

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login & get JWT |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/profile` | Private | Update profile |
| GET | `/api/auth/users` | Admin | List all users |
| PUT | `/api/auth/users/:id/ban` | Admin | Ban/unban user |
| PUT | `/api/auth/users/:id/role` | Admin | Change user role |

### Location Endpoints

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| GET | `/api/locations` | Public | Get all locations (with filters) |
| GET | `/api/locations/:id` | Public | Get single location |
| POST | `/api/locations` | Private | Add new location |
| PUT | `/api/locations/:id` | Private | Update location |
| DELETE | `/api/locations/:id` | Admin | Delete location |
| POST | `/api/locations/:id/vote` | Private | Upvote/downvote/confirm |
| PUT | `/api/locations/:id/flag` | Admin | Flag/approve location |
| GET | `/api/locations/dashboard` | Public | Dashboard statistics |
| GET | `/api/locations/flagged` | Admin | Get flagged locations |

### Query Filters (GET /api/locations)

```
?city=Mumbai
?type=hospital
?status=fully_accessible
?verified=true
?lat=19.07&lng=72.87&radius=5
```

---

## 🌐 Deployment on Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "🚀 SAHAJ - Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/sahaj
git push -u origin main
```

### Step 2: Deploy Backend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Set Framework Preset: **Other**
4. Set Root Directory: *(leave blank)*
5. Add Environment Variables:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = your secret key
   - `NODE_ENV` = production
6. Click **Deploy**

### Step 3: Update Frontend API URL

In all frontend JS files, replace:
```javascript
const API_BASE = 'http://localhost:5000/api';
```
With your Vercel deployment URL:
```javascript
const API_BASE = 'https://your-app.vercel.app/api';
```

### Step 4: Deploy Frontend (Optional - Separate)

You can deploy frontend separately on Vercel as a Static Site:
- Go to Vercel → New Project → import same repo
- Set Root Directory: `frontend`
- Framework: Other (static)

### MongoDB Atlas Production Setup

1. In Atlas → Network Access → Add `0.0.0.0/0` (allow all IPs for Vercel)
2. Database Access → create user with `readWriteAnyDatabase` role

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| **User** | View map, add locations, vote |
| **Contributor** | All user perms (auto-promoted after 10 contributions) |
| **Admin** | Full access: delete locations, ban users, manage all |

**First registered user becomes Admin automatically.**

---

## ✅ Verification System

- Users can **Upvote**, **Downvote**, or **Confirm** a location
- **5 Confirmations** → Location automatically becomes ✅ **Verified**
- Verified locations gain higher trust and visibility
- Admins can manually approve or remove locations

---

## 📊 Accessibility Score System

Scores are calculated automatically from selected features:

| Feature | Weight |
|---------|--------|
| Wheelchair Ramp | 1.5 |
| Elevator | 1.5 |
| Accessible Toilet | 1.5 |
| Wide Doors (90cm+) | 1.0 |
| Accessible Parking | 1.0 |
| Accessible Transport | 1.0 |
| Braille Signage | 0.5 |
| Audio Signals | 0.5 |
| Low-Floor Bus | 0.5 |
| Wheelchairs on Loan | 0.5 |

**Score → Status:**
- 7–10: 🟢 Fully Accessible
- 4–6: 🟡 Partially Accessible
- 0–3: 🔴 Not Accessible

---

## 🎨 Design System

- **Primary:** Saffron `#FF6B00` — energy, India
- **Secondary:** India Green `#138808` — growth, inclusion
- **Accent:** Deep Blue `#003399` — trust, government
- **Typography:** Yatra One (Display) + Mukta (Body)

---

## 📜 Legal Alignment

- **Rights of Persons with Disabilities Act, 2016** (RPWD Act)
- **SAHAJ Abhiyan** (Accessible India Campaign)
- **Vikshit Bharat 2047** Pillar 6: Social Inclusion & Justice
- **UNCRPD** (UN Convention on Rights of Persons with Disabilities)

---

## 🏆 Hackathon Highlights

✅ Full-stack Node.js + MongoDB architecture  
✅ Real-time community crowdsourcing  
✅ Automated accessibility score calculation  
✅ JWT authentication with role-based access  
✅ Interactive Leaflet.js map with custom markers  
✅ Photo upload evidence system  
✅ City-wise analytics dashboard  
✅ 5-confirmation verification system  
✅ Admin moderation panel  
✅ Vercel + MongoDB Atlas deployment ready  
✅ Indian civic design language (Tiranga palette)  
✅ Fully responsive mobile design  

---

## 🙏 Credits

Built with ❤️ for **Vikshit Bharat 2047 Hackathon**

*Jai Hind 🇮🇳*
