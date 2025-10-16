# Novello - Book Reading Tracker

A modern, cross-platform mobile application for tracking your book reading progress with cloud synchronization.

## 🌟 Features

### Core Functionality
- **📚 ISBN Scanner** - Scan book barcodes to automatically fetch book information
- **🌍 Multi-Source Book Data** - Fetches book details from:
  - Deutsche Nationalbibliothek (DNB) for German books
  - Google Books API
  - Open Library API
- **📖 Reading Progress Tracking** - Visual progress bars and page tracking
- **📊 Reading Statistics** - Comprehensive stats dashboard
- **☁️ Cloud Sync** - User-specific data synchronized across devices
- **🔐 Authentication** - Email/Password registration and login
- **👤 User Profiles** - Personal profile with reading statistics
- **🔄 Pull-to-Refresh** - Refresh data on all screens

---

## 🏗️ Technical Architecture

### Tech Stack

**Frontend:**
- React Native with Expo SDK 53
- Expo Router 5 (File-based routing)
- TypeScript
- React Context API
- Axios for HTTP
- expo-barcode-scanner, expo-camera

**Backend:**
- FastAPI (Python 3.11+)
- MongoDB with Motor (async)
- Bcrypt password hashing
- Cookie-based sessions
- HTTPx, xmltodict

**External APIs:**
- Deutsche Nationalbibliothek (DNB) SRU API
- Google Books API
- Open Library API

---

## 📁 Project Structure

```
novello/
├── frontend/              # Expo/React Native app
│   ├── app/              # Expo Router pages
│   │   ├── currently-reading.tsx
│   │   ├── want-to-read.tsx
│   │   ├── read.tsx
│   │   ├── stats.tsx
│   │   └── auth/         # Auth screens
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── context/      # Auth context
│   │   ├── services/     # API layer
│   │   └── types/        # TypeScript types
│   └── assets/
├── backend/
│   ├── server.py         # FastAPI app
│   └── requirements.txt
└── README.md
```

---

## 🚀 Deployment Guide

### ⚠️ **IMPORTANT: Production Database**

The current MongoDB is **local** to the development container. For production:

**1. Set up MongoDB Atlas** (Recommended)
```bash
# Get connection string from MongoDB Atlas
MONGO_URL="mongodb+srv://user:pass@cluster.mongodb.net/novello_db"
```

**2. Update backend/.env**
```env
MONGO_URL="your_atlas_connection_string"
DB_NAME="novello_db"
```

### Backend Deployment

**Option 1: Heroku**
```bash
heroku create novello-api
heroku config:set MONGO_URL="your_mongodb_atlas_url"
git push heroku main
```

**Option 2: Railway/Render/Fly.io**
- Connect GitHub repository
- Add environment variables
- Deploy automatically

### Frontend Deployment

**Mobile (iOS/Android):**
```bash
# Install EAS CLI
npm install -g eas-cli

# Build
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

**Web:**
```bash
npx expo export:web
vercel --prod
```

---

## 🗄️ Database Schema

### Collections

**users**
```javascript
{
  _id: "user_<random>",
  email: "user@example.com",
  name: "John Doe",
  password_hash: "bcrypt_hash",
  created_at: ISODate()
}
```

**books**
```javascript
{
  _id: ObjectId(),
  user_id: "user_<random>",
  isbn: "9783551559227",
  title: "Harry Potter...",
  author: "J. K. Rowling",
  coverImage: "https://...",
  totalPages: 334,
  currentPage: 150,
  status: "currently_reading",
  progress: 44.9,
  dateAdded: ISODate(),
  notes: "Great book!",
  rating: 5
}
```

---

## 📊 API Endpoints

**Authentication:**
- `POST /api/auth/register` - Create user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Books:**
- `GET /api/books/search/{isbn}` - Search by ISBN
- `POST /api/books` - Add book
- `GET /api/books` - Get all user's books
- `PUT /api/books/{id}` - Update book
- `DELETE /api/books/{id}` - Delete book

**Statistics:**
- `GET /api/stats` - Get reading statistics

---

## 🎯 Selling Points

### Why Novello?

1. **Cross-Platform** - iOS, Android, Web from single codebase
2. **German Book Support** - DNB integration
3. **Modern Stack** - React Native + FastAPI
4. **Scalable** - Cloud-ready architecture
5. **Secure** - Industry-standard auth
6. **Fast Development** - Days, not months
7. **Easy Maintenance** - Well-documented code
8. **Mobile-First** - Optimized for mobile devices

### Business Value
- Rapid deployment
- Low maintenance costs
- Easy to extend
- Modern tech attracts talent
- Cloud-native
- Production-ready

---

## 🔧 Setup (Development)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --port 8001 --reload

# Frontend
cd frontend
yarn install
npx expo start
```

---

## 📱 Testing on Mobile

**Expo Go (Development):**
1. Install Expo Go app
2. Scan QR code from terminal
3. ⚠️ Note: Local database won't be accessible from mobile

**Production Testing:**
1. Build standalone app with EAS
2. Install on device
3. Configure production backend URL

---

## 🐛 Known Issues

1. **Scanner on Expo Go** - Works on standalone builds only
2. **Local DB** - Can't access from mobile (use MongoDB Atlas for production)
3. **Google OAuth** - Requires additional platform configuration

---

## 📄 License

Proprietary Software. All rights reserved.

---

**Built with React Native, FastAPI, and MongoDB**
