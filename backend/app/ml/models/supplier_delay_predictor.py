import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score, precision_recall_curve
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
from typing import Tuple, Dict, Any
import joblib
import os
import logging

logger = logging.getLogger(__name__)


class SupplierDelayPredictor:
    """
    Supplier Delay Prediction Model using Logistic Regression, Random Forest, and XGBoost
    """

    def __init__(self):
        self.lr_model = LogisticRegression(random_state=42)
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.xgb_model = xgb.XGBClassifier(random_state=42, eval_metric='logloss')
        self.scaler = StandardScaler()
        self.is_trained = False

    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare features for supplier delay prediction

        Args:
            df: DataFrame with supplier data

        Returns:
            X (features) and y (target) arrays
        """
        df_copy = df.copy()

        # Select relevant features for delay prediction
        feature_columns = [
            'Lead times', 'Order quantities', 'Shipping costs',
            'Price', 'Availability', 'Number of products sold',
            'Lead times_normalized', 'Order quantities_normalized',
            'Shipping costs_normalized', 'Price_normalized',
            'Availability_normalized', 'Number of products sold_normalized'
        ]

        # Compute normalized features if missing (for inference)
        if 'Lead times_normalized' not in df_copy.columns and 'Lead times' in df_copy.columns:
            df_copy['Lead times_normalized'] = df_copy['Lead times'] / 30.0
        if 'Order quantities_normalized' not in df_copy.columns and 'Order quantities' in df_copy.columns:
            df_copy['Order quantities_normalized'] = df_copy['Order quantities'] / 100.0
        if 'Shipping costs_normalized' not in df_copy.columns and 'Shipping costs' in df_copy.columns:
            df_copy['Shipping costs_normalized'] = df_copy['Shipping costs'] / 50.0
        if 'Price_normalized' not in df_copy.columns and 'Price' in df_copy.columns:
            df_copy['Price_normalized'] = df_copy['Price'] / 500.0
        if 'Availability_normalized' not in df_copy.columns and 'Availability' in df_copy.columns:
            df_copy['Availability_normalized'] = df_copy['Availability'] / 100.0
        if 'Number of products sold_normalized' not in df_copy.columns and 'Number of products sold' in df_copy.columns:
            df_copy['Number of products sold_normalized'] = df_copy['Number of products sold'] / 1000.0

        # Only use columns that exist in the dataframe (now including computed ones)
        available_features = [col for col in feature_columns if col in df_copy.columns]
        X = df_copy[available_features]
        
        # Ensure that if we are doing inference, we populate all expected features with 0 if still missing
        if len(available_features) < len(feature_columns):
             for col in feature_columns:
                 if col not in X.columns:
                     X[col] = 0.0
             # Reorder to match training order
             X = X[feature_columns]

        # Target: delivery delay (binary)
        if 'delivery_delay' in df_copy.columns:
            y = df_copy['delivery_delay']
        else:
            # Create binary target based on lead times vs shipping times (only if available)
            if 'Lead times' in df_copy.columns and 'Shipping times' in df_copy.columns:
                y = (df_copy['Shipping times'] > df_copy['Lead times']).astype(int)
            else:
                # During inference, we don't have the target
                y = None

        return X, y

    def train(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Train Logistic Regression, Random Forest, and XGBoost models

        Args:
            df: Training data

        Returns:
            Dictionary with evaluation metrics for all models
        """
        logger.info("Preparing features for supplier delay prediction...")
        X, y = self.prepare_features(df)

        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        logger.info("Training Logistic Regression model...")
        # Train Logistic Regression
        self.lr_model.fit(X_train_scaled, y_train)

        logger.info("Training Random Forest model...")
        # Train Random Forest
        self.rf_model.fit(X_train, y_train)

        logger.info("Training XGBoost model...")
        # Train XGBoost
        self.xgb_model.fit(X_train, y_train)

        # Evaluate models
        results = {}

        # Logistic Regression evaluation
        lr_pred = self.lr_model.predict(X_test_scaled)
        lr_proba = self.lr_model.predict_proba(X_test_scaled)[:, 1]
        results['logistic_regression'] = {
            'accuracy': accuracy_score(y_test, lr_pred),
            'roc_auc': roc_auc_score(y_test, lr_proba)
        }

        # Random Forest evaluation
        rf_pred = self.rf_model.predict(X_test)
        rf_proba = self.rf_model.predict_proba(X_test)[:, 1]
        results['random_forest'] = {
            'accuracy': accuracy_score(y_test, rf_pred),
            'roc_auc': roc_auc_score(y_test, rf_proba)
        }

        # XGBoost evaluation
        xgb_pred = self.xgb_model.predict(X_test)
        xgb_proba = self.xgb_model.predict_proba(X_test)[:, 1]
        results['xgboost'] = {
            'accuracy': accuracy_score(y_test, xgb_pred),
            'roc_auc': roc_auc_score(y_test, xgb_proba)
        }

        logger.info(f"Logistic Regression - Accuracy: {results['logistic_regression']['accuracy']:.4f}, ROC-AUC: {results['logistic_regression']['roc_auc']:.4f}")
        logger.info(f"Random Forest - Accuracy: {results['random_forest']['accuracy']:.4f}, ROC-AUC: {results['random_forest']['roc_auc']:.4f}")
        logger.info(f"XGBoost - Accuracy: {results['xgboost']['accuracy']:.4f}, ROC-AUC: {results['xgboost']['roc_auc']:.4f}")

        self.is_trained = True
        return results

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the XGBoost model (primary model)

        Args:
            df: Input data for prediction

        Returns:
            Array of predictions (binary: 0 or 1)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        X, _ = self.prepare_features(df)
        return self.xgb_model.predict(X)

    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """
        Get prediction probabilities

        Args:
            df: Input data for prediction

        Returns:
            Array of prediction probabilities
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        X, _ = self.prepare_features(df)
        return self.xgb_model.predict_proba(X)[:, 1]  # Return probability of positive class

    def predict_single(self, supplier_data: Dict[str, float]) -> Tuple[int, float]:
        """
        Predict delay for a single supplier

        Args:
            supplier_data: Dictionary with supplier information

        Returns:
            Tuple of (prediction: 0 or 1, probability: 0-1)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        # Create a single-row dataframe for prediction
        single_df = pd.DataFrame([supplier_data])

        pred = self.predict(single_df)[0] if len(self.predict(single_df)) > 0 else 0
        proba = self.predict_proba(single_df)[0] if len(self.predict_proba(single_df)) > 0 else 0.0

        return pred, proba

    def save_model(self, filepath: str):
        """
        Save the trained model to disk

        Args:
            filepath: Path to save the model
        """
        model_data = {
            'lr_model': self.lr_model,
            'rf_model': self.rf_model,
            'xgb_model': self.xgb_model,
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
        instance.lr_model = model_data['lr_model']
        instance.rf_model = model_data['rf_model']
        instance.xgb_model = model_data['xgb_model']
        instance.scaler = model_data['scaler']
        instance.is_trained = model_data['is_trained']
        logger.info(f"Model loaded from {filepath}")
        return instance