# IoT Installer Hub

A comprehensive IoT network installation and connectivity management system built with React Native (frontend) and Node.js/TypeScript (backend). This project was developed as a freelance solution for an IoT cabling company to streamline their installation and network management processes.

## 📋 Project Overview

IoT Installer Hub is designed to streamline IoT network installation processes for cabling companies, providing tools for:
- **Installation Management**: QR code scanning, location tracking, and cabling instructions
- **Connectivity Mapping**: Visual network path tracing and apparatus port management
- **Certification Testing**: Interactive port testing and connectivity validation
- **Real-time Data**: Live connectivity status and network topology visualization

## 🏗️ Architecture

### Frontend (React Native + Expo)
- **Framework**: React Native with Expo Router
- **UI**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router with stack navigation
- **QR Scanning**: Expo Camera with barcode scanner
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom components

### Backend (Node.js/TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with pg driver
- **API**: RESTful endpoints with CORS support
- **Utilities**: Custom connectivity mapping and data processing



## 📁 Project Structure

```
IoT Installer Hub/
├── frontend/                 # React Native app
│   ├── app/                  # Main application screens
│   │   ├── components/       # Reusable UI components
│   │   ├── connectivity/     # Network mapping features
│   │   ├── installation/     # Installation workflow
│   │   ├── testing/          # Certification testing
│   │   ├── contexts/         # React Context providers
│   │   └── utils/            # Utility functions
│   ├── assets/               # Images and fonts
│   └── package.json
├── backend/                  # Node.js/TypeScript backend
│   ├── src/
│   │   ├── controllers/      # API route handlers
│   │   ├── routes/           # Express routes
│   │   ├── utils/            # Business logic utilities
│   │   └── aws/              # Database configuration
│   └── package.json

├── QRs/                      # QR code assets
└── full.sql                  # Database schema
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- PostgreSQL (for backend)

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on device/simulator:**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

### Backend Setup (Node.js)

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file
   cp .env.example .env
   # Edit with your database credentials
   ```

3. **Set up database:**
   ```bash
   # Import schema
   psql -U your_user -d your_database -f ../full.sql
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```



## 🔧 Configuration

### Frontend Configuration
Update API endpoints in `frontend/app/utils/` files:
```typescript
const API_BASE = 'http://localhost:3004/api';
```

### Backend Configuration
- Update database connection in `backend/src/aws/db.ts`

## 📱 Features

### Installation Flow
1. **QR Scanner**: Scan apparatus QR codes
2. **Location Details**: Enter site, building, floor, room information
3. **Cabling Instructions**: Step-by-step installation guidance
4. **Loading Simulation**: Progress tracking for connectivity mapping
5. **Certification Testing**: Interactive port testing

### Connectivity Mapping
1. **Apparatus View**: Visual port representation
2. **Network Path**: End-to-end connection tracing
3. **Active Link Search**: Filter and search connections
4. **QR Scanner Integration**: Quick apparatus identification

### Key Components
- **QR Scanner**: Camera integration with barcode detection
- **Dynamic Forms**: Location-based form generation
- **Port Visualization**: Interactive port overlays
- **Progress Tracking**: Real-time installation status
- **Error Handling**: Comprehensive error management

## 🛠️ Development

### Code Structure
- **Modular Architecture**: Separated concerns with clear boundaries
- **TypeScript**: Full type safety across the stack
- **Component Reusability**: Shared components and utilities
- **State Management**: Context API for global state

### Key Utilities
- **QR Validation**: Apparatus type detection and validation
- **Location Filtering**: Multi-directional filtering logic
- **Connectivity Mapping**: Network topology generation
- **Data Processing**: Real-time data transformation

### Testing
```bash
# Frontend linting
cd frontend
npm run lint

# Backend testing (when implemented)
cd backend
npm test
```

## 📊 Database Schema

The project uses PostgreSQL with tables for:
- **PP Locations**: Patch panel location data
- **IO Locations**: Input/Output device locations
- **Connectivity Map**: Network connection mappings
- **Switch Data**: Network switch information
- **Trace Data**: Connection path information

## 🔄 API Endpoints

### Core Endpoints
- `GET /api/pp-location/{serial}` - Get patch panel location
- `GET /api/io-location/{mac}` - Get IO device location
- `POST /api/pp-location` - Create patch panel location
- `POST /api/io-location` - Create IO device location
- `GET /api/connectivity-map/{site}` - Get site connectivity
- `POST /api/auto-connectivity` - Generate connectivity mappings

## 🚀 Deployment

### Frontend Deployment
- **Expo**: Use Expo Application Services (EAS)
- **Standalone**: Build native apps for App Store/Play Store

### Backend Deployment
- Deploy to AWS, Heroku, or similar cloud platforms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🏢 Project Context

This project was developed as a freelance solution for an IoT cabling company looking to digitize and streamline their installation processes. The system helps technicians efficiently manage IoT network installations, track connectivity, and maintain quality standards throughout the cabling process.
 
