# 🎓 CollegeConnect

A modern campus event management platform built with Next.js, Spring Boot, and Firebase.

## 🌟 Features

- **Event Discovery**: Browse all campus events with interactive map visualization
- **Role-Based Access**: Presidents can create/manage events, students can view and navigate
- **Real-Time Navigation**: Get turn-by-turn directions to event locations using Leaflet routing
- **Firebase Authentication**: Secure anonymous login with role-based profiles
- **Responsive Design**: Built with shadcn/ui components and Tailwind CSS

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.3 with React 18 and TypeScript
- **UI**: shadcn/ui components + Tailwind CSS
- **Maps**: Leaflet with routing-machine
- **Auth**: Firebase Authentication
- **Hosting**: Vercel

### Backend
- **Framework**: Spring Boot 3.2.6 (Java 17)
- **Database**: Firebase Firestore
- **Security**: Firebase token verification with CORS
- **Hosting**: Render.com (Docker)

## 🚀 Quick Start

### Running Locally
See **[START_HERE.md](START_HERE.md)** for complete local development setup.

### Deploying to Production
See **[EASY_DEPLOYMENT.md](EASY_DEPLOYMENT.md)** for Render + Vercel deployment guide.

### OOP Implementation Proof
See **[backend/README_OOP.md](backend/README_OOP.md)** for comprehensive documentation of all Java OOP concepts (classes, objects, methods, constructors, access specifiers, overloading, inheritance, interfaces, abstract methods, packages).

## 🌐 Live Demo

- **Frontend**: https://college-connect-kohi.vercel.app
- **Backend API**: https://collegeconnect-backend-htrb.onrender.com

## 📁 Project Structure

```
CollegeConnect/
├── src/                    # Next.js frontend
│   ├── app/               # Pages and layouts
│   ├── components/        # React components
│   ├── firebase/          # Firebase config and hooks
│   └── types/             # TypeScript definitions
├── backend/               # Spring Boot backend
│   └── src/main/java/com/collegeconnect/
│       ├── model/         # Entity classes
│       ├── service/       # Business logic
│       ├── controllers/   # REST API endpoints
│       ├── config/        # Configuration
│       └── security/      # Auth filters
└── docs/                  # Additional documentation
```

## 🎯 Key API Endpoints

- `GET /api/events` - List all events
- `GET /api/events/{id}` - Get event details
- `POST /api/events` - Create event (presidents only)
- `GET /api/users/{uid}` - Get user profile
- `PUT /api/users/{uid}` - Update user profile

## 📝 License

MIT License - feel free to use this project for educational purposes.

---

Built with ❤️ for college communities
