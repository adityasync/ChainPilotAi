import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


class InventoryRiskClassifier:
    """
    Inventory Risk Classification Model using Random Forest and Logistic Regression
    """

    def __init__(self):
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.lr_model = LogisticRegression(random_state=42)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False

    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare features for inventory risk classification

        Args:
            df: DataFrame with inventory data

        Returns:
            X (features) and y (target) arrays
        """
        df_copy = df.copy()

        # Select relevant features for inventory risk classification
        feature_columns = [
            'Availability', 'Number of products sold', 'Revenue generated',
            'Stock levels', 'Lead times', 'Order quantities', 'Shipping costs',
            'Price', 'Availability_normalized', 'Number of products sold_normalized',
            'Revenue generated_normalized', 'Stock levels_normalized', 'Lead times_normalized',
            'Order quantities_normalized', 'Shipping costs_normalized'
        ]

        # Compute normalized features if missing (for inference)
        if 'Availability_normalized' not in df_copy.columns and 'Availability' in df_copy.columns:
            df_copy['Availability_normalized'] = df_copy['Availability'] / 100.0
        if 'Number of products sold_normalized' not in df_copy.columns and 'Number of products sold' in df_copy.columns:
            df_copy['Number of products sold_normalized'] = df_copy['Number of products sold'] / 1000.0
        if 'Revenue generated_normalized' not in df_copy.columns and 'Revenue generated' in df_copy.columns:
            df_copy['Revenue generated_normalized'] = df_copy['Revenue generated'] / 50000.0
        if 'Stock levels_normalized' not in df_copy.columns and 'Stock levels' in df_copy.columns:
            df_copy['Stock levels_normalized'] = df_copy['Stock levels'] / 500.0
        if 'Lead times_normalized' not in df_copy.columns and 'Lead times' in df_copy.columns:
            df_copy['Lead times_normalized'] = df_copy['Lead times'] / 30.0
        if 'Order quantities_normalized' not in df_copy.columns and 'Order quantities' in df_copy.columns:
            df_copy['Order quantities_normalized'] = df_copy['Order quantities'] / 100.0
        if 'Shipping costs_normalized' not in df_copy.columns and 'Shipping costs' in df_copy.columns:
            df_copy['Shipping costs_normalized'] = df_copy['Shipping costs'] / 50.0

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

        # Target: inventory risk label (only if available)
        if 'inventory_risk_label' in df_copy.columns:
            y = self.label_encoder.fit_transform(df_copy['inventory_risk_label'])
        else:
            y = None

        return X, y

    def train(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Train both Random Forest and Logistic Regression models

        Args:
            df: Training data

        Returns:
            Dictionary with evaluation metrics for both models
        """
        logger.info("Preparing features for inventory risk classification...")
        X, y = self.prepare_features(df)

        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        logger.info("Training Random Forest classifier...")
        # Train Random Forest
        self.rf_model.fit(X_train, y_train)

        logger.info("Training Logistic Regression classifier...")
        # Train Logistic Regression
        self.lr_model.fit(X_train_scaled, y_train)

        # Evaluate models
        results = {}

        # Random Forest evaluation
        rf_pred = self.rf_model.predict(X_test)
        results['random_forest'] = {
            'accuracy': accuracy_score(y_test, rf_pred),
            'classification_report': classification_report(y_test, rf_pred,
                                                          target_names=self.label_encoder.classes_)
        }

        # Logistic Regression evaluation
        lr_pred = self.lr_model.predict(X_test_scaled)
        results['logistic_regression'] = {
            'accuracy': accuracy_score(y_test, lr_pred),
            'classification_report': classification_report(y_test, lr_pred,
                                                          target_names=self.label_encoder.classes_)
        }

        logger.info(f"Random Forest - Accuracy: {results['random_forest']['accuracy']:.4f}")
        logger.info(f"Logistic Regression - Accuracy: {results['logistic_regression']['accuracy']:.4f}")

        self.is_trained = True
        return results

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the Random Forest model (primary model)

        Args:
            df: Input data for prediction

        Returns:
            Array of predictions (encoded labels)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        X, _ = self.prepare_features(df)
        return self.rf_model.predict(X)

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
        return self.rf_model.predict_proba(X)

    def predict_labels(self, df: pd.DataFrame) -> np.ndarray:
        """
        Make predictions and return actual labels (not encoded)

        Args:
            df: Input data for prediction

        Returns:
            Array of prediction labels
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        encoded_preds = self.predict(df)
        return self.label_encoder.inverse_transform(encoded_preds)

    def predict_single(self, product_data: Dict[str, float]) -> str:
        """
        Predict inventory risk for a single product

        Args:
            product_data: Dictionary with product information

        Returns:
            Predicted risk label
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        # Create a single-row dataframe for prediction
        single_df = pd.DataFrame([product_data])

        pred_label = self.predict_labels(single_df)
        return pred_label[0] if len(pred_label) > 0 else "Normal"

    def save_model(self, filepath: str):
        """
        Save the trained model to disk

        Args:
            filepath: Path to save the model
        """
        model_data = {
            'rf_model': self.rf_model,
            'lr_model': self.lr_model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
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
        instance.rf_model = model_data['rf_model']
        instance.lr_model = model_data['lr_model']
        instance.scaler = model_data['scaler']
        instance.label_encoder = model_data['label_encoder']
        instance.is_trained = model_data['is_trained']
        logger.info(f"Model loaded from {filepath}")
        return instance