# ✈️ Atlasia — Premium AI Travel Planner

Atlasia is a modern, full-stack travel planner web application built with **React/Vite** and **Node.js/Express**. Featuring a sleek glassmorphic layout, it allows users to organize routes, track Rupee-denominated expenses, write auto-saving travel journals, and leverage **Google Gemini AI** to plan full itineraries and query localized travel tips.

---

## 🌟 Core Features

### 1. Landing Page
* **Hero Search Box**: Search a target destination to directly initiate route building.
* **Curated Travel Spots**: Highlights popular travel ideas (Kyoto, Swiss Alps, Paris) with quick links to create a trip.

### 2. Multi-Shelf Dashboard
* **Favorite Trips Shelf**: Interactive favorites row at the top with instant heart toggling (optimistic Zustand updates).
* **Adventures Shelves**: Dynamically splits active/upcoming routes from historical/completed journeys.
* **Overview Analytics**: Dynamic dashboard widgets displaying total planned budget, accumulated ledger expenses, average budget per trip, and total trip counts.

### 3. Interactive Trip Details Workspace
* **📅 Timeline Tab**: Schedule daily activities, add location names, and pin geographic coordinates.
* **💰 Rupee Expense Ledger**: Categorize expenses (Hotel, Transport, Food, Entertainment, Other) with a real-time progress budget bar.
* **📝 Auto-Save Notes Canvas**: Background auto-save journal that debounces keypresses and displays status indicators (`Saving...` / `Saved` / `Save Failed`).
* **⛅ Weather Sidebar**: Renders destination weather and 3-day conditions.

### 4. Gemini AI Copilot
* **✨ AI Smart Timeline Generator**: Generates custom day-by-day travel schedules using Gemini `gemini-2.5-flash` with robust JSON extraction and full rendering protection.
* **💬 Destination Chat Companion**: Destination-specific chatbot helper leveraging the new `@google/genai` client SDK to answer questions about food, stays, or local transit.

---

## 🛠️ Tech Stack
* **Frontend**: React, Vite, Zustand (State Management), Axios (HTTP Client), Vanilla CSS.
* **Backend**: Node.js, Express.js, MongoDB/Mongoose (Database), Joi/Custom validators.
* **AI Integration**: Google `@google/genai` SDK (`gemini-2.5-flash` model).

---

## 📂 Project Structure

```
Atlasia/
├── backend/
│   ├── src/
│   │   ├── config/          # DB & Auth connection configurations
│   │   ├── controllers/     # Route controller handlers (auth, trip, ai)
│   │   ├── middlewares/     # Authentication & validator middlewares
│   │   ├── models/          # Mongoose Schemas (User, Trip)
│   │   ├── routes/          # Express Routers
│   │   ├── services/        # Logic layer (Auth, Gemini AI, Trip updates)
│   │   ├── validators/      # Custom request validators
│   │   └── server.js        # Main server entrypoint
│   └── .env                 # Backend environment variables (ignored)
│
└── frontend/
    ├── src/
    │   ├── api/             # API Axios calls (authApi, tripApi, aiApi)
    │   ├── components/      # UI elements, navbar, search box
    │   ├── features/        # Zustand state store slices (auth, trip)
    │   ├── layouts/         # Dashboard & landing layouts
    │   ├── pages/           # Landing, Dashboard, Login, Register, TripDetails
    │   └── styles/          # Styling system (globals.css)
    └── index.html           # Main index
```

---

## ⚙️ Setup and Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or local MongoDB instance

---

### 1. Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5001
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   DATABASE_URL=your_mongodb_connection_string_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the backend development server (will run on Port `5001`):
   ```bash
   npm run dev
   ```

---

### 2. Frontend Setup

1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```
4. Start the frontend Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

---

## ⚙️ Development Highlights & Security
* **Mac AirPlay Port Compatibility**: Default backend port is shifted to `5001` to avoid macOS AirPlay Receiver system occupancy conflicts on port `5000`.
* **API Security**: Added `.gitignore` configurations to prevent accidental commits of local credentials (`.env`) and local modules.
* **Partial Update Validators**: Configured a flexible update validator in the API route level allowing updates to notes or itineraries without failing schema validation fields.
* **Crash-Proof UI Layout**: Integrates strict React child checks to stringify nested JSON properties safely during AI stream parsing.
