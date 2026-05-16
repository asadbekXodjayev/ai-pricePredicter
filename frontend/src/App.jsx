import { useState, useEffect, useCallback, useRef } from 'react';

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Feature configuration with ranges and defaults
const FEATURE_CONFIG = {
  square_feet: {
    label: 'Square Footage',
    min: 500,
    max: 8000,
    step: 50,
    default: 2200,
    unit: 'sq ft'
  },
  bedrooms: {
    label: 'Bedrooms',
    min: 0,
    max: 10,
    step: 1,
    default: 3,
    unit: 'beds'
  },
  bathrooms: {
    label: 'Bathrooms',
    min: 1,
    max: 6,
    step: 0.5,
    default: 2.5,
    unit: 'baths'
  },
  age_years: {
    label: 'Property Age',
    min: 0,
    max: 100,
    step: 1,
    default: 15,
    unit: 'years'
  },
  lot_size_sqft: {
    label: 'Lot Size',
    min: 2000,
    max: 50000,
    step: 500,
    default: 8500,
    unit: 'sq ft'
  },
  garage_spaces: {
    label: 'Garage Spaces',
    min: 0,
    max: 4,
    step: 1,
    default: 2,
    unit: 'spaces'
  }
};

const NEIGHBORHOODS = ['downtown', 'urban', 'suburban', 'rural'];
const PROPERTY_TYPES = ['single_family', 'condo', 'townhouse', 'apartment'];
const CONDITIONS = ['excellent', 'good', 'fair', 'poor'];

function App() {
  // Numerical feature states
  const [squareFeet, setSquareFeet] = useState(FEATURE_CONFIG.square_feet.default);
  const [bedrooms, setBedrooms] = useState(FEATURE_CONFIG.bedrooms.default);
  const [bathrooms, setBathrooms] = useState(FEATURE_CONFIG.bathrooms.default);
  const [ageYears, setAgeYears] = useState(FEATURE_CONFIG.age_years.default);
  const [lotSizeSqft, setLotSizeSqft] = useState(FEATURE_CONFIG.lot_size_sqft.default);
  const [garageSpaces, setGarageSpaces] = useState(FEATURE_CONFIG.garage_spaces.default);
  
  // Categorical feature states
  const [neighborhood, setNeighborhood] = useState('suburban');
  const [propertyType, setPropertyType] = useState('single_family');
  const [condition, setCondition] = useState('good');
  
  // Prediction state
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Debounce ref for cleanup
  const debounceRef = useRef(null);

  // Build current input object
  const getInputData = useCallback(() => ({
    square_feet: squareFeet,
    bedrooms: bedrooms,
    bathrooms: bathrooms,
    age_years: ageYears,
    lot_size_sqft: lotSizeSqft,
    garage_spaces: garageSpaces,
    neighborhood: neighborhood,
    property_type: propertyType,
    condition: condition
  }), [squareFeet, bedrooms, bathrooms, ageYears, lotSizeSqft, garageSpaces, neighborhood, propertyType, condition]);

  // Fetch prediction from API
  const fetchPrediction = useCallback(async (inputData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Prediction failed');
      }
      
      const data = await response.json();
      setPrediction(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced prediction effect (250ms debounce)
  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new debounce timer
    debounceRef.current = setTimeout(() => {
      const inputData = getInputData();
      fetchPrediction(inputData);
    }, 250);
    
    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [getInputData, fetchPrediction]);

  // Format price for display
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Handle slider changes
  const handleSliderChange = (setter, value) => {
    setter(Number(value));
  };

  // Reset to defaults
  const handleReset = () => {
    setSquareFeet(FEATURE_CONFIG.square_feet.default);
    setBedrooms(FEATURE_CONFIG.bedrooms.default);
    setBathrooms(FEATURE_CONFIG.bathrooms.default);
    setAgeYears(FEATURE_CONFIG.age_years.default);
    setLotSizeSqft(FEATURE_CONFIG.lot_size_sqft.default);
    setGarageSpaces(FEATURE_CONFIG.garage_spaces.default);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)`
        }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            <span className="text-red-500">▮</span> REAL ESTATE
            <span className="text-red-500 ml-2">▮</span>
          </h1>
          <p className="text-xl text-slate-300 font-light tracking-wide">
            PRICE PREDICTION ENGINE
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto mt-6"></div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Control Panel - Left Column */}
          <div className="lg:col-span-2">
            <div className="glass-panel backdrop-blur-xl bg-slate-800/40 border-2 border-red-500/30 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-red-500/20">
                <h2 className="text-2xl font-bold text-white tracking-wide">
                  <span className="text-red-500 mr-2">◆</span> PROPERTY PARAMETERS
                </h2>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-semibold text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/10 transition-all duration-200 uppercase tracking-wider"
                >
                  Reset All
                </button>
              </div>

              {/* Sliders Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Square Feet */}
                <div className="slider-group">
                  <label className="flex justify-between items-center mb-3">
                    <span className="text-slate-300 font-medium uppercase tracking-wider text-sm">
                      Square Footage
                    </span>
                    <span className="text-red-400 font-bold text-lg">
                      {squareFeet.toLocaleString()} <span className="text-xs text-slate-500">sq ft</span>
                    </span>
                  </label>
                  <input
                    type="range"
                    min={FEATURE_CONFIG.square_feet.min}
                    max={FEATURE_CONFIG.square_feet.max}
                    step={FEATURE_CONFIG.square_feet.step}
                    value={squareFeet}
                    onChange={(e) => handleSliderChange(setSquareFeet, e.target.value)}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb border-2 border-red-500/30 hover:border-red-500/60 transition-all"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{FEATURE_CONFIG.square_feet.min.toLocaleString()}</span>
                    <span>{FEATURE_CONFIG.square_feet.max.toLocaleString()}</span>
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="slider-group">
                  <label className="flex justify-between items-center mb-3">
                    <span className="text-slate-300 font-medium uppercase tracking-wider text-sm">
                      Bedrooms
                    </span>
                    <span className="text-red-400 font-bold text-lg">
                      {bedrooms} <span className="text-xs text-slate-500">beds</span>
                    </span>
                  </label>
                  <input
                    type="range"
                    min={FEATURE_CONFIG.bedrooms.min}
                    max={FEATURE_CONFIG.bedrooms.max}
                    step={FEATURE_CONFIG.bedrooms.step}
                    value={bedrooms}
                    onChange={(e) => handleSliderChange(setBedrooms, e.target.value)}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb border-2 border-red-500/30 hover:border-red-500/60 transition-all"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{FEATURE_CONFIG.bedrooms.min}</span>
                    <span>{FEATURE_CONFIG.bedrooms.max}</span>
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="slider-group">
                  <label className="flex justify-between items-center mb-3">
                    <span className="text-slate-300 font-medium uppercase tracking-wider text-sm">
                      Bathrooms
                    </span>
                    <span className="text-red-400 font-bold text-lg">
                      {bathrooms} <span className="text-xs text-slate-500">baths</span>
                    </span>
                  </label>
                  <input
                    type="range"
                    min={FEATURE_CONFIG.bathrooms.min}
                    max={FEATURE_CONFIG.bathrooms.max}
                    step={FEATURE_CONFIG.bathrooms.step}
                    value={bathrooms}
                    onChange={(e) => handleSliderChange(setBathrooms, e.target.value)}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb border-2 border-red-500/30 hover:border-red-500/60 transition-all"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{FEATURE_CONFIG.bathrooms.min}</span>
                    <span>{FEATURE_CONFIG.bathrooms.max}</span>
                  </div>
                </div>

                {/* Property Age */}
                <div className="slider-group">
                  <label className="flex justify-between items-center mb-3">
                    <span className="text-slate-300 font-medium uppercase tracking-wider text-sm">
                      Property Age
                    </span>
                    <span className="text-red-400 font-bold text-lg">
                      {ageYears} <span className="text-xs text-slate-500">years</span>
                    </span>
                  </label>
                  <input
                    type="range"
                    min={FEATURE_CONFIG.age_years.min}
                    max={FEATURE_CONFIG.age_years.max}
                    step={FEATURE_CONFIG.age_years.step}
                    value={ageYears}
                    onChange={(e) => handleSliderChange(setAgeYears, e.target.value)}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb border-2 border-red-500/30 hover:border-red-500/60 transition-all"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0</span>
                    <span>{FEATURE_CONFIG.age_years.max}</span>
                  </div>
                </div>

                {/* Lot Size */}
                <div className="slider-group">
                  <label className="flex justify-between items-center mb-3">
                    <span className="text-slate-300 font-medium uppercase tracking-wider text-sm">
                      Lot Size
                    </span>
                    <span className="text-red-400 font-bold text-lg">
                      {lotSizeSqft.toLocaleString()} <span className="text-xs text-slate-500">sq ft</span>
                    </span>
                  </label>
                  <input
                    type="range"
                    min={FEATURE_CONFIG.lot_size_sqft.min}
                    max={FEATURE_CONFIG.lot_size_sqft.max}
                    step={FEATURE_CONFIG.lot_size_sqft.step}
                    value={lotSizeSqft}
                    onChange={(e) => handleSliderChange(setLotSizeSqft, e.target.value)}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb border-2 border-red-500/30 hover:border-red-500/60 transition-all"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{(FEATURE_CONFIG.lot_size_sqft.min / 1000).toFixed(0)}K</span>
                    <span>{(FEATURE_CONFIG.lot_size_sqft.max / 1000).toFixed(0)}K</span>
                  </div>
                </div>

                {/* Garage Spaces */}
                <div className="slider-group">
                  <label className="flex justify-between items-center mb-3">
                    <span className="text-slate-300 font-medium uppercase tracking-wider text-sm">
                      Garage Spaces
                    </span>
                    <span className="text-red-400 font-bold text-lg">
                      {garageSpaces} <span className="text-xs text-slate-500">spaces</span>
                    </span>
                  </label>
                  <input
                    type="range"
                    min={FEATURE_CONFIG.garage_spaces.min}
                    max={FEATURE_CONFIG.garage_spaces.max}
                    step={FEATURE_CONFIG.garage_spaces.step}
                    value={garageSpaces}
                    onChange={(e) => handleSliderChange(setGarageSpaces, e.target.value)}
                    className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb border-2 border-red-500/30 hover:border-red-500/60 transition-all"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{FEATURE_CONFIG.garage_spaces.min}</span>
                    <span>{FEATURE_CONFIG.garage_spaces.max}</span>
                  </div>
                </div>
              </div>

              {/* Categorical Selectors */}
              <div className="grid md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-red-500/20">
                {/* Neighborhood */}
                <div>
                  <label className="block text-slate-400 font-medium uppercase tracking-wider text-xs mb-3">
                    Neighborhood
                  </label>
                  <div className="relative">
                    <select
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/60 border-2 border-red-500/30 rounded-lg text-white font-semibold appearance-none cursor-pointer hover:border-red-500/60 transition-all focus:outline-none focus:border-red-500"
                    >
                      {NEIGHBORHOODS.map(n => (
                        <option key={n} value={n}>
                          {n.charAt(0).toUpperCase() + n.slice(1)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-slate-400 font-medium uppercase tracking-wider text-xs mb-3">
                    Property Type
                  </label>
                  <div className="relative">
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/60 border-2 border-red-500/30 rounded-lg text-white font-semibold appearance-none cursor-pointer hover:border-red-500/60 transition-all focus:outline-none focus:border-red-500"
                    >
                      {PROPERTY_TYPES.map(t => (
                        <option key={t} value={t}>
                          {t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-slate-400 font-medium uppercase tracking-wider text-xs mb-3">
                    Condition
                  </label>
                  <div className="relative">
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/60 border-2 border-red-500/30 rounded-lg text-white font-semibold appearance-none cursor-pointer hover:border-red-500/60 transition-all focus:outline-none focus:border-red-500"
                    >
                      {CONDITIONS.map(c => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel - Right Column */}
          <div className="lg:col-span-1">
            <div className="glass-panel backdrop-blur-xl bg-slate-800/40 border-2 border-red-500/30 rounded-2xl p-8 shadow-2xl sticky top-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white tracking-wide mb-2">
                  <span className="text-red-500 mr-2">◆</span> PREDICTED VALUE
                </h2>
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Calculating...</span>
                  </div>
                )}
                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-2">
                    ⚠ {error}
                  </div>
                )}
              </div>

              {prediction && !loading && (
                <div className="space-y-6">
                  {/* Main Price Display */}
                  <div className="text-center py-6 border-y-2 border-red-500/30">
                    <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                      {formatPrice(prediction.predicted_price)}
                    </div>
                  </div>

                  {/* Confidence Interval */}
                  <div className="bg-slate-900/40 rounded-xl p-4 border border-red-500/20">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                      Confidence Range (85%)
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 font-semibold">
                        {formatPrice(prediction.confidence_interval[0])}
                      </span>
                      <span className="text-slate-500 text-sm">to</span>
                      <span className="text-red-400 font-semibold">
                        {formatPrice(prediction.confidence_interval[1])}
                      </span>
                    </div>
                    {/* Progress bar visualization */}
                    <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 rounded-full transition-all duration-300"
                        style={{ width: '70%' }}
                      ></div>
                    </div>
                  </div>

                  {/* Input Summary */}
                  <div className="bg-slate-900/40 rounded-xl p-4 border border-red-500/20">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                      Property Summary
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Size</span>
                        <span className="text-white font-medium">{prediction.input_features.square_feet.toLocaleString()} sq ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bed/Bath</span>
                        <span className="text-white font-medium">
                          {prediction.input_features.bedrooms} / {prediction.input_features.bathrooms}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type</span>
                        <span className="text-white font-medium capitalize">{prediction.input_features.property_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Neighborhood</span>
                        <span className="text-white font-medium capitalize">{prediction.input_features.neighborhood}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Condition</span>
                        <span className="text-white font-medium capitalize">{prediction.input_features.condition}</span>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  {lastUpdated && (
                    <div className="text-center text-xs text-slate-500">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}

              {!prediction && !loading && !error && (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-4">◈</div>
                  <p>Adjust the sliders to see</p>
                  <p>price predictions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <div className="text-slate-500 text-sm">
            <span className="text-red-500">▮</span> Powered by Gradient Boosting ML Model <span className="text-red-500 ml-2">▮</span>
          </div>
        </footer>
      </div>

      {/* Custom Styles for Slider */}
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          cursor: pointer;
          border: 3px solid #1e293b;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          transition: all 0.2s ease;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.6);
        }
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          cursor: pointer;
          border: 3px solid #1e293b;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          transition: all 0.2s ease;
        }
        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.6);
        }
        .glass-panel {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
}

export default App;