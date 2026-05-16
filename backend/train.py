"""
Real Estate Price Predictor - Training Pipeline

This script generates mock real estate data and trains a Scikit-Learn
ColumnTransformer Pipeline that encapsulates all preprocessing steps
(SimpleImputer, StandardScaler, OneHotEncoder) within the model artifact.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib
import os


def generate_mock_data(n_samples=10000, random_state=42):
    """
    Generate synthetic real estate data for training.
    """
    np.random.seed(random_state)
    
    square_feet = np.random.randint(800, 5001, n_samples)
    bedrooms = np.random.randint(1, 7, n_samples)
    bathrooms = np.random.randint(1, 5, n_samples)
    age_years = np.random.randint(0, 101, n_samples)
    lot_size_sqft = np.random.randint(2000, 20001, n_samples)
    garage_spaces = np.random.randint(0, 4, n_samples)
    
    neighborhoods = ['urban', 'suburban', 'rural', 'downtown']
    neighborhood_weights = [0.3, 0.35, 0.15, 0.2]
    neighborhood = np.random.choice(neighborhoods, n_samples, p=neighborhood_weights)
    
    property_types = ['single_family', 'condo', 'townhouse', 'apartment']
    property_type_weights = [0.4, 0.25, 0.2, 0.15]
    property_type = np.random.choice(property_types, n_samples, p=property_type_weights)
    
    conditions = ['excellent', 'good', 'fair', 'poor']
    condition_weights = [0.15, 0.45, 0.3, 0.1]
    condition = np.random.choice(conditions, n_samples, p=condition_weights)
    
    df = pd.DataFrame({
        'square_feet': square_feet,
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'age_years': age_years,
        'lot_size_sqft': lot_size_sqft,
        'garage_spaces': garage_spaces,
        'neighborhood': neighborhood,
        'property_type': property_type,
        'condition': condition
    })
    
    base_price = 50000
    sqft_contribution = df['square_feet'] * np.random.uniform(100, 200, n_samples)
    bedroom_contribution = df['bedrooms'] * 15000
    bathroom_contribution = df['bathrooms'] * 20000
    age_penalty = df['age_years'] * 500 + (df['age_years'] ** 1.5) * 50
    lot_contribution = df['lot_size_sqft'] * np.random.uniform(5, 15, n_samples)
    garage_contribution = df['garage_spaces'] * 10000
    
    neighborhood_multipliers = {'downtown': 1.4, 'urban': 1.2, 'suburban': 1.0, 'rural': 0.8}
    neighborhood_mult = df['neighborhood'].map(neighborhood_multipliers)
    
    property_multipliers = {'single_family': 1.1, 'condo': 0.85, 'townhouse': 0.95, 'apartment': 0.75}
    property_mult = df['property_type'].map(property_multipliers)
    
    condition_multipliers = {'excellent': 1.2, 'good': 1.0, 'fair': 0.85, 'poor': 0.65}
    condition_mult = df['condition'].map(condition_multipliers)
    
    price = (
        base_price + sqft_contribution + bedroom_contribution + bathroom_contribution -
        age_penalty + lot_contribution + garage_contribution
    ) * neighborhood_mult * property_mult * condition_mult
    
    noise = np.random.uniform(0.95, 1.05, n_samples)
    price = price * noise
    df['price'] = np.maximum(price, 25000).round(2)
    
    return df


def create_preprocessing_pipeline():
    """Create a ColumnTransformer pipeline for preprocessing."""
    numerical_features = ['square_feet', 'bedrooms', 'bathrooms', 'age_years', 'lot_size_sqft', 'garage_spaces']
    categorical_features = ['neighborhood', 'property_type', 'condition']
    
    numerical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='unknown')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, numerical_features),
            ('cat', categorical_transformer, categorical_features)
        ],
        remainder='drop'
    )
    
    return preprocessor, numerical_features, categorical_features


def train_model():
    """Main training function."""
    print("=" * 60)
    print("Real Estate Price Predictor - Training Pipeline")
    print("=" * 60)
    
    print("\n[1/5] Generating mock training data...")
    df = generate_mock_data(n_samples=10000)
    print(f"      Generated {len(df)} samples")
    
    print("\n[2/5] Preparing features and target...")
    feature_columns = ['square_feet', 'bedrooms', 'bathrooms', 'age_years',
                       'lot_size_sqft', 'garage_spaces', 'neighborhood',
                       'property_type', 'condition']
    X = df[feature_columns]
    y = df['price']
    print(f"      Feature matrix shape: {X.shape}")
    
    print("\n[3/5] Splitting data into train/test sets...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"      Training samples: {len(X_train)}, Test samples: {len(X_test)}")
    
    print("\n[4/5] Creating and training the model pipeline...")
    preprocessor, num_features, cat_features = create_preprocessing_pipeline()
    
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', GradientBoostingRegressor(
            n_estimators=200, learning_rate=0.1, max_depth=5,
            min_samples_split=5, min_samples_leaf=3, subsample=0.8,
            random_state=42, validation_fraction=0.1, n_iter_no_change=10, tol=1e-4
        ))
    ])
    
    model_pipeline.fit(X_train, y_train)
    print("      Pipeline training complete!")
    
    print("\n[5/5] Evaluating model performance...")
    train_score = model_pipeline.score(X_train, y_train)
    test_score = model_pipeline.score(X_test, y_test)
    
    y_train_pred = model_pipeline.predict(X_train)
    y_test_pred = model_pipeline.predict(X_test)
    
    train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
    train_mae = mean_absolute_error(y_train, y_train_pred)
    test_mae = mean_absolute_error(y_test, y_test_pred)
    
    print(f"      Training R²: {train_score:.4f}, Test R²: {test_score:.4f}")
    print(f"      Training RMSE: ${train_rmse:,.2f}, Test RMSE: ${test_rmse:,.2f}")
    
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(backend_dir, 'model.pkl')
    joblib.dump(model_pipeline, model_path)
    print(f"\n      Model saved to: {model_path}")
    
    feature_info = {
        'numerical_features': num_features,
        'categorical_features': cat_features,
        'feature_columns': feature_columns
    }
    feature_info_path = os.path.join(backend_dir, 'feature_info.pkl')
    joblib.dump(feature_info, feature_info_path)
    print(f"      Feature info saved to: {feature_info_path}")
    
    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)
    
    return model_pipeline


if __name__ == '__main__':
    train_model()