# NestIQ — Production Deployment Guide

This guide details instructions for deploying the NestIQ application to production environments.

---

## 1. Backend Deployment (Railway)

Railway is recommended for Spring Boot + MySQL deployments because of its zero-config database provisioning.

### Step 1: Provision MySQL
1. Log in to [Railway.app](https://railway.app).
2. Click **New Project** → **Provision MySQL**.
3. Railway automatically sets up the database and exposes environment variables:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

### Step 2: Deploy Spring Boot Backend
1. Click **New Service** → **GitHub Repository** → Select `nestiq-backend`.
2. Go to the Service **Settings** and add the following **Environment Variables**:
   - `SPRING_DATASOURCE_URL` = `jdbc:mysql://${{MYSQLHOST}}:${{MYSQLPORT}}/${{MYSQLDATABASE}}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`
   - `SPRING_DATASOURCE_USERNAME` = `${{MYSQLUSER}}`
   - `SPRING_DATASOURCE_PASSWORD` = `${{MYSQLPASSWORD}}`
   - `SPRING_JPA_HIBERNATE_DDL_AUTO` = `update`
   - `GEMINI_API_KEY` = `[Your Google Gemini API Key]`
   - `SPRING_MAIL_HOST` = `smtp.gmail.com`
   - `SPRING_MAIL_PORT` = `587`
   - `SPRING_MAIL_USERNAME` = `[Your Gmail Address]`
   - `SPRING_MAIL_PASSWORD` = `[Your App Password]`
   - `NESTIQ_EMAIL_FROM` = `NestIQ <your-email@gmail.com>`
   - `JWT_SECRET` = `[Your Long Super Secret Key String]`
3. Railway will auto-detect the Maven wrapper and build and deploy the container on port `8080`. Go to **Settings** → **Generate Domain** to get the public backend URL (e.g., `nestiq-backend.up.railway.app`).

---

## 2. Frontend Deployment (Vercel)

Vercel is optimized for building and serving Vite React applications.

### Step 1: Setup Vercel Project
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** → **Project** → Select `NESTIQF` or the frontend folder `nestiq`.
3. In the configure project panel:
   - **Framework Preset**: Vite
   - **Root Directory**: `nestiq` (if nesting exists) or `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Set Environment Variables
Add the following key-value pairs under **Environment Variables**:
- `VITE_API_BASE_URL` = `https://nestiq-backend.up.railway.app` (your backend URL)

### Step 3: Handle SPA Client-Side Routing
Since React Router handles routing on the client side, accessing dashboard links directly in the browser will result in Vercel returning `404 Not Found` unless redirected.
To fix this, create a `vercel.json` file inside the root of your frontend folder (`nestiq/`):
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 3. CORS Configuration

For the frontend to communicate with the backend, you must enable CORS (Cross-Origin Resource Sharing) on the backend for your specific Vercel URL.

In `SecurityConfig.java` or `WebMvcConfigurer` (in Spring Boot), make sure the allowed origins list is mapped dynamic or reads from an environment variable:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("http://localhost:5173", "https://your-app.vercel.app"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```
If using Spring Boot properties to configure CORS:
```properties
nestiq.cors.allowed-origins=http://localhost:5173,https://your-app.vercel.app
```
Use the environment variable override `NESTIQ_CORS_ALLOWED_ORIGINS` in Railway settings to match your Vercel deployment URL.
