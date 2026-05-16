"""
Real Estate Price Predictor - FastAPI Backend

This module provides a FastAPI application that handles:
- Input validation using Pydantic models
- CORS configuration for frontend communication
- Model inference using the pre-trained joblib pipeline
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


# Initialize FastAPI app
app = FastAPI(
    title="Real Estate Price Predictor API",
    description="Predict property prices using machine learning",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length"],
    max_age=3600,
)

# Load the pre-trained model pipeline
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model.pkl')

try:
    model_pipeline = joblib.load(MODEL_PATH)
    print(f"Model loaded successfully from {MODEL_PATH}")
except FileNotFoundError:
    model_pipeline = None
    print(f"Warning: Model not found at {MODEL_PATH}. Run train.py first.")
except Exception as e:
    model_pipeline = None
    print(f"Error loading model: {e}")


# Pydantic models for request/response validation
class PropertyInput(BaseModel):
    """
    Input model for a single property prediction.
    All fields are validated with sensible ranges.
    """
    square_feet: float = Field(
        ..., 
        ge=100, 
        le=20000,
        description="Living area in square feet (100-20,000)"
    )
    bedrooms: int = Field(
        ..., 
        ge=0, 
        le=20,
        description="Number of bedrooms (0-20)"
    )
    bathrooms: float = Field(
        ..., 
        ge=0.5, 
        le=10,
        description="Number of bathrooms (0.5-10)"
    )
    age_years: int = Field(
        ..., 
        ge=0, 
        le=200,
        description="Age of property in years (0-200)"
    )
    lot_size_sqft: float = Field(
        ..., 
        ge=500, 
        le=100000,
        description="Lot size in square feet (500-100,000)"
    )
    garage_spaces: int = Field(
        ..., 
        ge=0, 
        le=10,
        description="Number of garage spaces (0-10)"
    )
    neighborhood: str = Field(
        ...,
        pattern="^(urban|suburban|rural|downtown)$",
        description="Neighborhood type: urban, suburban, rural, or downtown"
    )
    property_type: str = Field(
        ...,
        pattern="^(single_family|condo|townhouse|apartment)$",
        description="Property type: single_family, condo, townhouse, or apartment"
    )
    condition: str = Field(
        ...,
        pattern="^(excellent|good|fair|poor)$",
        description="Property condition: excellent, good, fair, or poor"
    )

    @field_validator('square_feet', 'lot_size_sqft')
    @classmethod
    def validate_positive(cls, v):
        if v <= 0:
            raise ValueError('Must be a positive number')
        return round(v, 2)

    @field_validator('age_years')
    @classmethod
    def validate_age(cls, v):
        if v < 0:
            raise ValueError('Age cannot be negative')
        return v


class PropertyBatchInput(BaseModel):
    """Input model for batch predictions."""
    properties: List[PropertyInput] = Field(
        ..., 
        min_length=1, 
        max_length=100,
        description="List of property inputs (1-100)"
    )


class PredictionResult(BaseModel):
    """Single prediction result."""
    predicted_price: float
    confidence_interval: tuple
    timestamp: str
    input_features: dict


class BatchPredictionResult(BaseModel):
    """Batch prediction result."""
    predictions: List[PredictionResult]
    total_count: int
    timestamp: str


class HealthCheck(BaseModel):
    """Health check response model."""
    status: str
    timestamp: str
    model_loaded: bool
    version: str


# API Endpoints

@app.get("/", response_model=HealthCheck, tags=["Health"])
async def root():
    """Root endpoint providing health check information."""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        model_loaded=model_pipeline is not None,
        version="1.0.0"
    )


@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    """Detailed health check endpoint."""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        model_loaded=model_pipeline is not None,
        version="1.0.0"
    )


@app.post(
    "/predict",
    response_model=PredictionResult,
    status_code=status.HTTP_200_OK,
    tags=["Predictions"]
)
async def predict(property_data: PropertyInput):
    """
    Predict the price of a single property.
    
    Takes property features and returns a predicted price with
    a confidence interval based on the model's predictions.
    """
    if model_pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Please run train.py to train and save the model."
        )
    
    try:
        # Convert input to dictionary
        input_dict = property_data.model_dump()
        
        # Define feature order (must match training)
        feature_columns = ['square_feet', 'bedrooms', 'bathrooms', 
                          'age_years', 'lot_size_sqft', 'garage_spaces',
                          'neighborhood', 'property_type', 'condition']
        
        # Create DataFrame with proper column ordering
        input_df = pd.DataFrame([input_dict])[feature_columns]
        
        # Make prediction
        predicted_price = float(model_pipeline.predict(input_df)[0])
        
        # Calculate confidence interval (approximate using prediction variance)
        # For a more accurate interval, use prediction intervals from the model
        margin = predicted_price * 0.15  # 15% margin as approximation
        confidence_lower = round(predicted_price - margin, 2)
        confidence_upper = round(predicted_price + margin, 2)
        
        return PredictionResult(
            predicted_price=round(predicted_price, 2),
            confidence_interval=(confidence_lower, confidence_upper),
            timestamp=datetime.utcnow().isoformat(),
            input_features=input_dict
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )


@app.post(
    "/predict/batch",
    response_model=BatchPredictionResult,
    status_code=status.HTTP_200_OK,
    tags=["Predictions"]
)
async def predict_batch(properties: PropertyBatchInput):
    """
    Predict prices for multiple properties in a single request.
    
    Takes a list of property features and returns predicted prices
    for all properties.
    """
    if model_pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Please run train.py to train and save the model."
        )
    
    try:
        predictions = []
        
        # Define feature order (must match training)
        feature_columns = ['square_feet', 'bedrooms', 'bathrooms', 
                          'age_years', 'lot_size_sqft', 'garage_spaces',
                          'neighborhood', 'property_type', 'condition']
        
        for prop in properties.properties:
            input_dict = prop.model_dump()
            
            # Create DataFrame with proper column ordering
            input_df = pd.DataFrame([input_dict])[feature_columns]
            predicted_price = float(model_pipeline.predict(input_df)[0])
            
            margin = predicted_price * 0.15
            confidence_lower = round(predicted_price - margin, 2)
            confidence_upper = round(predicted_price + margin, 2)
            
            predictions.append(PredictionResult(
                predicted_price=round(predicted_price, 2),
                confidence_interval=(confidence_lower, confidence_upper),
                timestamp=datetime.utcnow().isoformat(),
                input_features=input_dict
            ))
        
        return BatchPredictionResult(
            predictions=predictions,
            total_count=len(predictions),
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction error: {str(e)}"
        )


@app.get("/features", tags=["Documentation"])
async def get_features():
    """
    Returns information about expected input features.
    """
    return {
        "numerical_features": {
            "square_feet": {
                "type": "float",
                "range": [100, 20000],
                "description": "Living area in square feet"
            },
            "bedrooms": {
                "type": "integer",
                "range": [0, 20],
                "description": "Number of bedrooms"
            },
            "bathrooms": {
                "type": "float",
                "range": [0.5, 10],
                "description": "Number of bathrooms"
            },
            "age_years": {
                "type": "integer",
                "range": [0, 200],
                "description": "Age of property in years"
            },
            "lot_size_sqft": {
                "type": "float",
                "range": [500, 100000],
                "description": "Lot size in square feet"
            },
            "garage_spaces": {
                "type": "integer",
                "range": [0, 10],
                "description": "Number of garage spaces"
            }
        },
        "categorical_features": {
            "neighborhood": {
                "type": "string",
                "values": ["urban", "suburban", "rural", "downtown"],
                "description": "Neighborhood type"
            },
            "property_type": {
                "type": "string",
                "values": ["single_family", "condo", "townhouse", "apartment"],
                "description": "Type of property"
            },
            "condition": {
                "type": "string",
                "values": ["excellent", "good", "fair", "poor"],
                "description": "Property condition"
            }
        }
    }


@app.get("/stats", tags=["Documentation"])
async def get_stats():
    """
    Returns model statistics and metadata.
    """
    return {
        "model_info": {
            "algorithm": "GradientBoostingRegressor",
            "n_estimators": 200,
            "max_depth": 5,
            "learning_rate": 0.1
        },
        "preprocessing": {
            "numerical_transform": "SimpleImputer(median) + StandardScaler",
            "categorical_transform": "SimpleImputer(constant) + OneHotEncoder"
        },
        "performance": {
            "training_r2": "0.94+",
            "test_r2": "0.92+",
            "description": "R² scores on mock training data"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )