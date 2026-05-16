# Real Estate Price Predictor

A full-stack machine learning web application that predicts property prices using real-time user inputs. Features a professional "Industrial Americana" design aesthetic with glassmorphic UI components.

---

## Quick Start - How to Run

### Prerequisites
- Python 3.9+
- Node.js 18+
- pip and npm

### Step 1: Install Backend Dependencies
```bash
cd real-estate-predictor/backend
pip install -r requirements.txt
```

### Step 2: Train the Model (if not already done)
```bash
python train.py
```
This generates `model.pkl` and `feature_info.pkl` with a trained GradientBoostingRegressor.

### Step 3: Start the Backend Server
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Step 4: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### Step 5: Start the Frontend Development Server
```bash
npm run dev
```
- Application: http://localhost:5173

---

## Project Architecture

### Directory Structure
```
real-estate-predictor/
├── backend/
│   ├── main.py              # FastAPI application (API endpoints, CORS, validation)
│   ├── train.py             # Training pipeline (mock data generation, model training)
│   ├── requirements.txt     # Python dependencies
│   ├── model.pkl            # Trained Scikit-Learn pipeline
│   └── feature_info.pkl     # Feature metadata
├── frontend/
│   ├── index.html           # HTML entry point
│   ├── vite.config.js       # Vite bundler configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── postcss.config.js    # PostCSS configuration
│   ├── package.json         # Node.js dependencies
│   └── src/
│       ├── main.jsx         # React entry point
│       ├── App.jsx          # Main application component (UI + API calls)
│       └── index.css        # Tailwind CSS + custom styles
└── project.md               # This documentation file
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                    (React 18 + Vite + Tailwind CSS)                      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Glassmorphic Dashboard                        │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │  Slider Inputs  │  │  Dropdowns      │  │  Price Display  │  │   │
│  │  │  (6 features)   │  │  (3 categories) │  │  + Confidence   │  │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │   │
│  │           │                    │                    │           │   │
│  │           └────────────────────┴────────────────────┘           │   │
│  │                                    │                             │   │
│  │                           ┌────────▼────────┐                   │   │
│  │                           │  Debouncer      │                   │   │
│  │                           │  (250ms)        │                   │   │
│  │                           └────────┬────────┘                   │   │
│  └────────────────────────────────────┼────────────────────────────┘   │
└───────────────────────────────────────┼────────────────────────────────┘
                                        │ HTTP POST /predict
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│                      (FastAPI + Python + Scikit-Learn)                   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    FastAPI Application                           │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │   Pydantic      │  │    CORS         │  │    /predict     │  │   │
│  │  │   Validation    │  │   Middleware    │  │    Endpoint     │  │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │   │
│  │           │                    │                    │           │   │
│  │           └────────────────────┴────────────────────┘           │   │
│  │                                    │                             │   │
│  │                           ┌────────▼────────┐                   │   │
│  │                           │   DataFrame     │                   │   │
│  │                           │   Converter     │                   │   │
│  │                           └────────┬────────┘                   │   │
│  └────────────────────────────────────┼────────────────────────────┘   │
│                                       │                                 │
│                                       ▼                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Scikit-Learn Pipeline (model.pkl)                   │  │
│  │  ┌──────────────────────────────────────────────────────────┐   │  │
│  │  │                    ColumnTransformer                       │   │  │
│  │  │  ┌─────────────────┐    ┌─────────────────┐              │   │  │
│  │  │  │ Numerical       │    │ Categorical     │              │   │  │
│  │  │  │ Pipeline:       │    │ Pipeline:       │              │   │  │
│  │  │  │ - SimpleImputer │    │ - SimpleImputer │              │   │  │
│  │  │  │ - StandardScaler│    │ - OneHotEncoder │              │   │  │
│  │  │  └─────────────────┘    └─────────────────┘              │   │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  │                                    │                              │  │
│  │                                    ▼                              │  │
│  │  ┌──────────────────────────────────────────────────────────┐   │  │
│  │  │           GradientBoostingRegressor                      │   │  │
│  │  │           (n_estimators=200, max_depth=5)                │   │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                              Predicted Price +
                            Confidence Interval
```

---

## Logic Flow

### 1. User Interaction (Frontend)
1. User adjusts sliders for property features:
   - Square Footage (500-8000 sq ft)
   - Bedrooms (0-10)
   - Bathrooms (1-6)
   - Property Age (0-100 years)
   - Lot Size (2000-50000 sq ft)
   - Garage Spaces (0-4)
2. User selects categorical features:
   - Neighborhood (downtown, urban, suburban, rural)
   - Property Type (single_family, condo, townhouse, apartment)
   - Condition (excellent, good, fair, poor)

### 2. Debouncing Mechanism
1. Every slider change triggers state update
2. `useEffect` hook detects state change
3. 250ms debounce timer prevents API spam during continuous adjustments
4. After debounce period, prediction request is sent

### 3. API Request (Frontend → Backend)
1. POST request to `http://localhost:8000/predict`
2. JSON payload with all 9 features
3. CORS headers validated by FastAPI middleware

### 4. Backend Processing
1. **Pydantic Validation**: Input data validated against `PropertyInput` schema
2. **DataFrame Conversion**: Dictionary converted to pandas DataFrame with correct column order
3. **Pipeline Prediction**: DataFrame passed to Scikit-Learn pipeline
   - Numerical features → SimpleImputer → StandardScaler
   - Categorical features → SimpleImputer → OneHotEncoder
   - Combined features → GradientBoostingRegressor → Price prediction
4. **Confidence Interval**: ±15% margin calculated around prediction

### 5. Response (Backend → Frontend)
1. JSON response with:
   - `predicted_price`: Final price estimate
   - `confidence_interval`: [lower, upper] bounds
   - `timestamp`: When prediction was made
   - `input_features`: Echo of input data
2. Frontend updates price display with animation

### 6. UI Update
1. Price displayed in large typography
2. Confidence range shown with progress bar
3. Property summary card shows all input features
4. Last updated timestamp refreshed

---

## Model Details

### Algorithm: GradientBoostingRegressor
- **n_estimators**: 200 trees
- **learning_rate**: 0.1
- **max_depth**: 5 levels
- **min_samples_split**: 5
- **min_samples_leaf**: 3
- **subsample**: 0.8 (80% of samples per tree)

### Preprocessing Pipeline
1. **Numerical Features** (6):
   - SimpleImputer(strategy='median') - fills missing values
   - StandardScaler() - normalizes to mean=0, std=1

2. **Categorical Features** (3):
   - SimpleImputer(strategy='constant', fill_value='unknown')
   - OneHotEncoder(handle_unknown='ignore') - creates binary columns

### Performance Metrics
- Training R² Score: ~0.90
- Test R² Score: ~0.85
- Test RMSE: ~$106,654

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Detailed health status |
| POST | `/predict` | Single property prediction |
| POST | `/predict/batch` | Batch predictions (up to 100) |
| GET | `/features` | Feature documentation |
| GET | `/stats` | Model statistics |

---

## Design System: Industrial Americana

### Color Palette
- **Background**: Navy/Slate gradient (#0f172a → #020617)
- **Primary Accent**: Red (#ef4444 → #dc2626)
- **Text**: White (#f8fafc) and Slate (#94a3b8)
- **Borders**: Red with transparency (rgba(239, 68, 68, 0.3))

### Visual Effects
- **Glassmorphism**: backdrop-blur-xl with semi-transparent backgrounds
- **Shadows**: Multi-layer with red glow effects
- **Typography**: Inter font family with tracking
- **Animations**: Smooth transitions on hover/focus states

### UI Components
- Glass panels with red utility borders
- Custom slider thumbs with gradient fills
- Dropdown selectors with custom styling
- Loading spinners and error states