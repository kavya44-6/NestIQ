# 🏠 NestIQ - AI-Powered Real Estate Management Platform

NestIQ is a trust-centric real estate platform designed to simplify property discovery while reducing fake listings, fraud, and information asymmetry in the rental and property market.

The platform combines role-based property management, intelligent recommendations, rental price estimation, trust verification, and analytics into a single ecosystem.

---

## 🚀 Features

### 👤 User Management
- JWT Authentication
- Role-Based Access Control
- Customer Dashboard
- Property Owner Dashboard
- Agent Dashboard
- Admin Dashboard

### 🏡 Property Management
- Property Listing Creation
- Property Search & Filtering
- Property Details View
- Property Image Support
- Property Status Tracking

### 🤖 AI & Smart Features
- Personalized Property Recommendations
- Smart Home Matchmaking Engine
- Rental Price Prediction
- Property Similarity Analysis
- AI Chat Assistant
- Market Trend Analytics

### 🛡️ Trust & Verification
- Trust Score System
- Property Verification Status
- Agent Verification
- Owner Verification
- Fraud Prevention Mechanisms

### 📅 Customer Services
- Property Visit Scheduling
- Inquiry Management
- Contact Property Owner
- Recommendation Dashboard

### 📊 Analytics
- Rental Market Trends
- Area-wise Price Analysis
- Demand Insights
- Property Performance Metrics

---

## 🏗️ System Architecture

Frontend:
- React.js
- Vite
- HTML5
- CSS3
- JavaScript

Backend:
- Spring Boot
- Spring Security
- JWT Authentication
- REST APIs

Database:
- MySQL

AI/ML:
- Python
- Scikit-Learn
- TF-IDF Vectorization
- Cosine Similarity Recommendation Engine
- Random Forest Regression

---

## 🔄 Workflow

1. User registers and logs in.
2. User selects preferences and requirements.
3. Recommendation engine matches suitable properties.
4. Rent prediction model estimates market rent.
5. Trust system evaluates property credibility.
6. User schedules visits and contacts owners/agents.

---

## 🤖 AI Modules

### Recommendation Engine
Uses:
- TF-IDF Vectorization
- Cosine Similarity Scoring

Matches:
- Budget
- Lifestyle Preferences
- Family Requirements
- Property Features

### Rent Prediction
Uses:
- Random Forest Regressor
- Property Features:
  - City
  - Area
  - BHK
  - Furnishing
  - Parking
  - Property Age
  - Bathrooms

Generates:
- Estimated Rent
- Market Range
- Confidence Insights

---

## 📂 Project Structure

```
NestIQ
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   └── services
│
├── backend
│   ├── controller
│   ├── service
│   ├── repository
│   ├── model
│   └── security
│
├── python
│   ├── recommendation_engine.py
│   ├── rent_predictor.py
│   └── datasets
│
└── database
    └── schema.sql
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/NestIQ.git
cd NestIQ
```

### Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on:

```text
http://localhost:8080
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

### Database Setup

1. Create MySQL Database

```sql
CREATE DATABASE nestiq;
```

2. Update:

```properties
application.properties
```

with your database credentials.

---

## 🔐 Default Roles

- CUSTOMER
- OWNER
- AGENT
- ADMIN

---

## 🎯 Problem Statement

Current real-estate platforms often face:

- Fake property listings
- Lack of trust indicators
- Poor recommendation quality
- Limited pricing intelligence
- Fraud risks during property transactions

NestIQ addresses these challenges through verification, trust scoring, AI-powered recommendations, and intelligent analytics.

---

## 🔮 Future Enhancements

- Real-Time Market Data Integration
- Advanced Fraud Detection
- Explainable AI Recommendations
- Mobile Application
- Document Verification using OCR
- Property Image Analysis
- Voice-Based Property Search

---

## 👨‍💻 Team

Developed as a capstone project to demonstrate modern full-stack development, machine learning integration, and intelligent property management solutions.

---

## 📄 License

This project is developed for educational and academic purposes.
