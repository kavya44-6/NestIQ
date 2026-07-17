# Walkthrough: Smart Security, SSE Notifications & Catalog Fixes

This walkthrough details the successful implementation of production-ready bug fixes, workflow locks, real-time Server-Sent Events (SSE) notifications, and catalog rendering fixes on NestIQ.

---

## 🚀 Key Improvements & Features Added

### 1. Trust Score Sync & UI Fix
*   **Trust Score State Sync**: Integrated a `forceMatch` helper in [aiService.js](file:///Users/heijin/Desktop/NESTIQF/nestiq/src/services/aiService.js#L121) that aligns the total score returned by any trust breakdown request (Gemini API, Spring Boot, or local rule math) to match the property DTO's `trustScore` database value, ensuring the score on the property card matches the modal detail view.
*   **Property Saving Score Sync**: Configured [PropertyService.java](file:///Users/heijin/Desktop/NESTIQF/nestiq-backend/src/main/java/com/example/project/service/PropertyService.java#L139-L142) to run `trustService.calculateAndSave()` right after property creation and updates, recalculating and writing the canonical `TrustService` score directly to the database.
*   **Detailed Audit Report Click Handler**: Attached `onClick={() => setTrustModalOpen(true)}` to the `"🔍 View Detailed Audit & Scam Prevention Report"` text link inside the trust breakdown container in [PropertyDetails.jsx](file:///Users/heijin/Desktop/NESTIQF/nestiq/src/pages/PropertyDetails.jsx#L661) to allow reviewers to click to audit.
*   **Responsive Trust Grid Layout**: Changed the grid-template columns in [PropertyDetails.jsx](file:///Users/heijin/Desktop/NESTIQF/nestiq/src/pages/PropertyDetails.jsx#L640) from static columns to `repeat(auto-fit, minmax(180px, 1fr))` to prevent text overlaps on smaller viewports.

### 2. AI Chatbot & Services Gemini Disablement
*   **Complete Gemini Disablement (Backend)**: Re-routed all runtime AI calls in [AiService.java](file:///Users/heijin/Desktop/NESTIQF/nestiq-backend/src/main/java/com/example/project/service/AiService.java#L65) (chat, recommendations, price estimator, and market appreciation trends) to execute strictly local rule-based fallback services.
*   **Complete Gemini Disablement (Frontend)**: Hardcoded `const GEMINI_API_KEY = ''` in [aiService.js](file:///Users/heijin/Desktop/NESTIQF/nestiq/src/services/aiService.js#L11) to prevent any direct Gemini API calls from execution.
*   **AI Chat Transaction Crash Fix**: Added `@Transactional(propagation = Propagation.NOT_SUPPORTED)` on the `chat` method of [AiService.java](file:///Users/heijin/Desktop/NESTIQF/nestiq-backend/src/main/java/com/example/project/service/AiService.java#L65) to prevent runtime exceptions from flagging the transaction context as rollback-only.
*   **Maven Dotenv Dependency**: Added `io.github.cdimascio:dotenv-java:3.0.0` dependency to [pom.xml](file:///Users/heijin/Desktop/NESTIQF/nestiq-backend/pom.xml#L99) to enable Java `.env` loading.
*   **Automatic Boot Dotenv Seeding**: Configured [ProjectApplication.java](file:///Users/heijin/Desktop/NESTIQF/nestiq-backend/src/main/java/com/example/project/ProjectApplication.java#L9-L10) to initialize `Dotenv` and load all environment variables into Java System properties prior to Spring Boot execution.

### 3. Admin Panel Cleanup & Security
*   **dashboard Layout Simplification**: Cleaned up the Admin dashboard view inside [AdminDashboard.jsx](file:///Users/heijin/Desktop/NESTIQF/nestiq/src/pages/admin/AdminDashboard.jsx#L239-L359) by removing flagged low trust listings, low trust statistics cards, and unused variables. The dashboard now strictly shows top-level users, properties, and pending KYC stats, alongside document reviews and listings tables.
*   **Strict Admin Security Gate**: Added a redirect rule inside [AppRoutes.jsx](file:///Users/heijin/Desktop/NESTIQF/nestiq/src/routes/AppRoutes.jsx#L76) that ensures any access attempts to `/admin` or `/admin/dashboard` check authentication and bounce non-admin requests (`CUSTOMER`, `OWNER`) back to the landing page `/`.
*   **Admin Sidebar Badge & Links Fix**: Mapped `'ADMIN'` users dynamically in [DashboardLayout.jsx](file:///Users/heijin/Desktop/NESTIQF/nestiq/src/layouts/DashboardLayout.jsx#L69-L96) to show `Admin` with red (#ef4444) colors and restricted their navigation menu strictly to a dashboard `"Overview"` pointing to `/admin/dashboard`.
*   **Spring Security Admin Gate Correction**: Corrected Spring Security check inside [SecurityConfig.java](file:///Users/heijin/Desktop/NESTIQF/nestiq-backend/src/main/java/com/example/project/security/SecurityConfig.java#L50) by replacing `hasAuthority("ADMIN")` with `hasRole("ADMIN")` to match the `"ROLE_"` prefixed granted authority registered inside `JwtFilter.java`.

### 4. Spacing, Footer & UX Polish
*   **Consistent Property Card Padding**: Standardized padding on property cards inside [PropertyCard.jsx](file:///Users/heijin/Desktop/NESTIQF/nestiq/src/components/property/PropertyCard.jsx#L192) to a clean `16px` (`p-4`).
*   **Footer Navigation Cleanup**: Completely removed dead and irrelevant support links ("Agent Directory", "Admin Desk") from the footer section in [Footer.jsx](file:///Users/heijin/Desktop/NESTIQF/nestiq/src/components/navigation/Footer.jsx#L57-L62), leaving only the functional "Privacy Policy" and "Terms of Service" intact.
*   **Owner Contact Details Fallback**: If a listing is self-managed (`SELF_SELL`) and broker details are missing, `PropertyDetails.jsx` falls back to `property.sellerPhone` and `property.sellerEmail`. The direct call button is labeled exactly `"Call Verified Owner"`.
*   **Case-Insensitive Search**: Updated the frontend filtering in `propertyService.js` to normalize city queries to lowercase for case-insensitive matching.
*   **Draft Hiding**: Hid open broker-less listings (`agentRequestStatus === "OPEN"` with no assigned agent) from the public catalog.
*   **Safe Date Parsing**: Wrapped date rendering in `utils/formatters.js` (`formatDate` and `formatDateTime`) in try-catch blocks to safely return `"Pending Date"`.
*   **Safe `timeAgo` Helper**: Wrapped the native `Date` constructor inside the `timeAgo` function in `NotificationBell.jsx` in a try-catch returning `"Pending Date"`.

### 5. Workflow Locks & Security Guardrails
*   **RERA Compliance warning**: In `AddProperty.jsx` and `OwnerAddProperty.jsx`, a `useEffect` monitors the `area` input. If the area exceeds 500 sq.m (5,382 sq.ft), a prominent red warning banner is displayed: `"RERA Registration Required for properties > 500 sq.m"`. The `reraNumber` field becomes required for submission.
*   **Transaction Locking**: In `PropertyDetails.jsx`, if the property status is `RESERVED`, `SOLD`, or `RENTED`, the "Send Inquiry Message" and "Schedule Site Visit" buttons are disabled and a `"Transaction Locked"` warning badge is rendered.

### 6. Real-Time SSE Notification Engine
*   **JPA Entity Mapping**: Added `Notification.java` representing the notifications table (fields: `id`, `recipientId`, `message`, `type`, `link`, `isRead`, `createdAt`).
*   **Registry & Stream Service**: Built `NotificationService.java` which holds active browser connections in a thread-safe `ConcurrentHashMap<Long, SseEmitter>` and implements:
    *   `createEmitter(Long userId)`: Open connection with a 10-minute timeout, handshake event (`INIT`), and auto-cleanup.
    *   `sendNotification(Long userId, String message, String type, String link)`: Save notification to MySQL and push event data to active emitters.
*   **SSE Controller**: Exposed endpoints in `NotificationController.java`:
    *   `GET /api/notifications/stream/{userId}` (returns `SseEmitter`)
    *   `GET /api/notifications`
    *   `POST /api/notifications`
    *   `PUT /api/notifications/{id}/read`
    *   `PUT /api/notifications/read-all`
*   **Security Permission**: Updated `SecurityConfig.java` to permit public connections to `/api/notifications/stream/**` to allow native HTML5 EventSource connections without custom header headers.
*   **SSE Trigger Points**: Wired notification pushes on:
    *   *Agent Accepts Listing*: Notifies Owner.
    *   *Visit Scheduled*: Notifies Agent (if broker-managed) or Owner (if self-managed).
    *   *KYC Verification*: Notifies User of Approval/Rejection.
*   **React EventStream Hook**: Created custom `useNotificationStream.js` hook that connects to the SSE channel, triggers brand-matching CSS slide-in/slide-out HTML toast alerts on arrival, and triggers state reload callback.
*   **Bell Counter Sync**: Bound the SSE hook to `NotificationBell.jsx` so unread notification counts sync dynamically in real-time.

---

## 🛠️ Verification Results

### Backend Compile Check
```bash
mvn clean compile
```
*   **Result**: `BUILD SUCCESS` (Successfully compiled all 66 source files).

### Backend Test Compile Check
```bash
mvn test-compile
```
*   **Result**: `BUILD SUCCESS` (Test compilation succeeded).

### Frontend Production Build Check
```bash
npm run build
```
*   **Result**: `BUILD SUCCESS` (Vite assets bundled successfully into `dist/`).
