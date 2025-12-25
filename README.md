# Rent Map Platform

A full-featured web platform for publishing and discovering rental properties using an interactive map.

## Tech Stack

### Backend
- Java 21
- Spring Boot 3.2.0
- Spring Security (JWT)
- Spring WebSocket (STOMP)
- PostgreSQL
- MapStruct
- Lombok

### Frontend
- React 18
- Vite
- React Router
- Leaflet + React-Leaflet
- Tailwind CSS (Dark Mode)
- Axios
- SockJS + STOMP

## Features

- User authentication with JWT (Owner/Tenant roles)
- Interactive map with property markers
- Property publishing with map pin placement
- Property search and filtering
- Favorites/Wishlist
- Reviews and ratings
- Real-time chat via WebSocket
- Smart notifications
- Dark mode support

## Setup

### Prerequisites
- Java 21
- Node.js 18+
- Docker and Docker Compose

### Backend Setup

1. Start PostgreSQL:
```bash
docker-compose up -d
```

2. Build and run:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on http://localhost:8080

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run development server:
```bash
npm run dev
```

Frontend runs on http://localhost:5173

## API Documentation

Swagger UI available at: http://localhost:8080/swagger-ui.html

## Database

PostgreSQL database is automatically created on first run. Tables are created via JPA auto-ddl.

## Default Configuration

- Database: `rentmap`
- User: `rentmap`
- Password: `rentmap123`
- Port: `5432`

