import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
import os
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DemandForecastingModel:
    """
    Demand Forecasting Model using Linear Regression and Random Forest
    """

    def __init__(self):
        self.linear_model = LinearRegression()
        self.rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False

    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare features for demand forecasting

        Args:
            df: DataFrame with demand data

        Returns:
            X (features) and y (target) arrays
        """
        # Use time-based features and product information
        df_copy = df.copy()

        # Convert Order Date to datetime if it's not already
        df_copy['Order Date'] = pd.to_datetime(df_copy['Order Date'])

        # Extract time-based features
        df_copy['year'] = df_copy['Order Date'].dt.year
        df_copy['month'] = df_copy['Order Date'].dt.month
        df_copy['day_of_week'] = df_copy['Order Date'].dt.dayofweek
        df_copy['quarter'] = df_copy['Order Date'].dt.quarter

        # Encode categorical features (Product ID)
        product_mapping = {pid: idx for idx, pid in enumerate(df_copy['Product ID'].unique())}
        df_copy['product_encoded'] = df_copy['Product ID'].map(product_mapping)

        # Select features for modeling
        feature_columns = ['year', 'month', 'day_of_week', 'quarter', 'product_encoded']
        X = df_copy[feature_columns]
        
        # Target: demand quantity (only if available)
        if 'Quantity' in df_copy.columns:
            y = df_copy['Quantity']
        else:
            y = None

        return X, y

    def train(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Train both Linear Regression and Random Forest models

        Args:
            df: Training data

        Returns:
            Dictionary with evaluation metrics for both models
        """
        logger.info("Preparing features for demand forecasting...")
        X, y = self.prepare_features(df)

        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        logger.info("Training Linear Regression model...")
        # Train Linear Regression
        self.linear_model.fit(X_train_scaled, y_train)

        logger.info("Training Random Forest model...")
        # Train Random Forest
        self.rf_model.fit(X_train, y_train)  # Random Forest doesn't necessarily need scaling for input

        # Evaluate models
        results = {}

        # Linear Regression evaluation
        lr_pred = self.linear_model.predict(X_test_scaled)
        results['linear_regression'] = {
            'rmse': np.sqrt(mean_squared_error(y_test, lr_pred)),
            'mae': mean_absolute_error(y_test, lr_pred),
            'r2': r2_score(y_test, lr_pred)
        }

        # Random Forest evaluation
        rf_pred = self.rf_model.predict(X_test)
        results['random_forest'] = {
            'rmse': np.sqrt(mean_squared_error(y_test, rf_pred)),
            'mae': mean_absolute_error(y_test, rf_pred),
            'r2': r2_score(y_test, rf_pred)
        }

        logger.info(f"Linear Regression - RMSE: {results['linear_regression']['rmse']:.2f}, MAE: {results['linear_regression']['mae']:.2f}")
        logger.info(f"Random Forest - RMSE: {results['random_forest']['rmse']:.2f}, MAE: {results['random_forest']['mae']:.2f}")

        self.is_trained = True
        return results

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the Random Forest model (primary model)

        Args:
            df: Input data for prediction

        Returns:
            Array of predictions
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        X, _ = self.prepare_features(df)
        X_scaled = self.scaler.transform(X)
        return self.rf_model.predict(X)

    def predict_single(self, product_id: str, date: pd.Timestamp) -> float:
        """
        Predict demand for a specific product on a specific date

        Args:
            product_id: ID of the product
            date: Date for prediction

        Returns:
            Predicted demand quantity
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        # Create a single-row dataframe for prediction
        single_df = pd.DataFrame({
            'Product ID': [product_id],
            'Order Date': [date],
            'Sales': [0]  # Placeholder
        })

        pred = self.predict(single_df)
        return pred[0] if len(pred) > 0 else 0.0

    def save_model(self, filepath: str):
        """
        Save the trained model to disk

        Args:
            filepath: Path to save the model
        """
        model_data = {
            'linear_model': self.linear_model,
            'rf_model': self.rf_model,
            'scaler': self.scaler,
            'is_trained': self.is_trained
        }
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")

    @classmethod
    def load_model(cls, filepath: str):
        """
        Load a trained model from disk

        Args:
            filepath: Path to load the model from

        Returns:
            Loaded model instance
        """
        instance = cls()
        model_data = joblib.load(filepath)
        instance.linear_model = model_data['linear_model']
        instance.rf_model = model_data['rf_model']
        instance.scaler = model_data['scaler']
        instance.is_trained = model_data['is_trained']
        logger.info(f"Model loaded from {filepath}")
        return instance