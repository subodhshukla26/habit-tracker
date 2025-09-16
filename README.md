# Habit Tracker Web App

A full-stack habit tracking application built with React, Node.js, and PostgreSQL. Users can create personal habits, track daily progress, and follow friends for accountability.

- **Frontend**: [Deployed on Vercel](https://your-app.vercel.app) _(to be deployed)_
- **Backend API**: [Deployed on Railway](https://your-api.railway.app) _(to be deployed)_

### Core Functionality
- **User Authentication**: Secure registration and login with JWT tokens
- **Habit Management**: Create, edit, and delete personal habits
- **Progress Tracking**: Daily/weekly check-ins with streak counting
- **Social Features**: Follow friends and view their activity feed
- **Leaderboards**: See top performers based on completions and streaks

### User Interface
- **Modern Design**: Clean, responsive UI built with Tailwind CSS
- **Real-time Updates**: Instant feedback on habit completions
- **Mobile-First**: Fully responsive design for all devices
- **Intuitive Navigation**: Easy-to-use sidebar and dashboard layout

### Technical Features
- **Secure API**: Protected routes with JWT authentication
- **Database Optimization**: Efficient queries with proper indexing
- **Error Handling**: Comprehensive error handling and validation
- **Edge Case Prevention**: Duplicate habit prevention, self-follow blocking

##  Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - Relational database
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

##  Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd habit-tracker
```

### 2. Database Setup
```bash
# Install PostgreSQL and create database
createdb habit_tracker

# Run the schema (from backend directory)
psql -d habit_tracker -f database/schema.sql
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=habit_tracker
# DB_USER=your_username
# DB_PASSWORD=your_password
# JWT_SECRET=your-secret-key

# Start development server
npm run dev
```

### 4. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env with your API URL
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000


##  Database Schema

### Users Table
- User authentication and profile information
- Relationships: habits, follows, completions

### Habits Table
- Habit definitions with categories and frequencies
- Tracks active/inactive status
- Prevents duplicate habit names per user

### Habit Completions Table
- Records of habit check-ins with timestamps
- Prevents multiple check-ins per day
- Used for streak calculations

### User Follows Table
- Social following relationships
- Prevents self-follows and duplicate follows
- Powers activity feed and leaderboards

### Categories Table
- Predefined habit categories with colors and icons
- Health & Fitness, Learning, Productivity, etc.

##  API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Habits
- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/checkin` - Check in habit
- `DELETE /api/habits/:id/checkin` - Remove check-in

### Social
- `GET /api/social/feed` - Get activity feed
- `GET /api/social/leaderboard` - Get leaderboard
- `GET /api/social/users/search` - Search users
- `POST /api/social/follow/:userId` - Follow user
- `DELETE /api/social/follow/:userId` - Unfollow user

##  Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=habit_tracker
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```


 
