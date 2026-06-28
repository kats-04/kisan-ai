# 🌾 KrishiMitra – AI Farmer Advisory Copilot

A production-ready AI-powered agritech platform helping Indian farmers make smarter agricultural decisions.

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Copilot Chat | Multilingual farming advice (English, Hindi, Kannada) |
| 🌤️ Weather Intelligence | Live weather + 7-day forecast + AI farming alerts |
| 🌱 Crop Recommendations | AI-powered crop selection based on soil, region, season |
| 🔬 Disease Detection | Upload crop photo → AI detects disease + treatments |
| 📊 Market Prices | Live mandi prices with AI sell/hold recommendations |
| 🏛️ Government Schemes | PM-KISAN, PMFBY, KCC and more with AI explanations |
| 📅 Farm Calendar | Plan sowing, watering, fertilizer, harvest activities |
| 🎤 Voice Assistant | Speech-to-text in Hindi, Kannada, English |

## 🛠️ Tech Stack

**Frontend:** Next.js 14 · TypeScript · Tailwind CSS · Framer Motion · Recharts

**Backend:** Python 3.11+ · FastAPI · Uvicorn · Motor (async MongoDB)

**Database:** MongoDB (Atlas free tier recommended)

**AI:** Google Gemini 1.5 Flash · Groq (Llama 3) · HuggingFace (Mistral)

**Auth:** JWT · bcrypt password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)
- At least one free AI API key

### 1. Clone & Setup Backend

```bash
cd backend
cp ../.env.example .env
# Edit .env with your API keys
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Setup Frontend

```bash
cd frontend
cp ../.env.example .env.local
# Edit .env.local as needed, especially NEXT_PUBLIC_API_URL
npm install
npm run dev
```

Open http://localhost:3000

## 🔑 API Keys (All Free)

| Service | Get Key | Used For |
|---|---|---|
| Google Gemini | https://aistudio.google.com/ | Primary AI (recommended) |
| Groq | https://console.groq.com/ | Fast Llama 3 inference |
| HuggingFace | https://huggingface.co/settings/tokens | Mistral fallback |
| OpenWeather | https://openweathermap.org/api | Live weather data |
| MongoDB Atlas | https://cloud.mongodb.com/ | Free 512MB database |

## 🌐 Deployment

### Backend → Render (Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, select `backend/` folder
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables from `.env.example`

### Frontend → Netlify (Free)

1. Go to [netlify.com](https://netlify.com) → New site from Git
2. Select `frontend/` folder
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add env var: `NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com`
6. Install Netlify Next.js plugin

## 📁 Project Structure

```
kisan-ai/
├── backend/
│   ├── app/
│   │   ├── models/          # Pydantic data models
│   │   ├── views/           # FastAPI route handlers
│   │   ├── controllers/     # Business logic
│   │   ├── services/        # External service integrations
│   │   ├── ai/              # LLM providers & prompts
│   │   ├── middleware/       # Auth middleware
│   │   ├── database/        # MongoDB connection
│   │   ├── config/          # App settings
│   │   └── main.py          # FastAPI app entry point
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── app/                 # Next.js App Router pages
    │   ├── page.tsx         # Landing page
    │   ├── dashboard/       # Main dashboard
    │   ├── chat/            # AI Copilot chat
    │   ├── weather/         # Weather intelligence
    │   ├── crops/           # Crop recommendations
    │   ├── disease/         # Disease detection
    │   ├── market/          # Market prices & schemes
    │   ├── calendar/        # Farm calendar
    │   └── profile/         # User settings
    ├── components/
    │   ├── layout/          # Navbar, Sidebar, DashboardLayout
    │   ├── providers/       # Auth & Theme providers
    │   └── ui/              # Reusable UI components
    └── lib/
        ├── api.ts           # Axios API client
        └── utils.ts         # Utility functions
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register farmer |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Get profile |
| POST | `/api/v1/chat/message` | AI chat (supports streaming) |
| GET | `/api/v1/weather` | Weather + AI recommendations |
| POST | `/api/v1/crops/recommend` | Crop recommendations |
| POST | `/api/v1/crops/detect-disease` | Disease detection |
| GET | `/api/v1/market/prices` | Mandi prices |
| GET | `/api/v1/market/schemes` | Government schemes |

Full Swagger docs at: `http://localhost:8000/docs`

## 🌍 Supported Languages

- 🇬🇧 English
- 🇮🇳 Hindi (हिंदी)
- 🇮🇳 Kannada (ಕನ್ನಡ)

## 📄 License

MIT License – Built with ❤️ for Indian farmers
