import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


class CostAnomalyDetector:
    """
    Cost Anomaly Detection Model using Isolation Forest
    """

    def __init__(self, contamination=0.1):
        self.model = IsolationForest(contamination=contamination, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for cost anomaly detection

        Args:
            df: DataFrame with cost data

        Returns:
            X (features) array
        """
        df_copy = df.copy()

        # Select relevant features for anomaly detection
        feature_columns = [
            'Shipping costs', 'Number of products sold', 'Price',
            'Order quantities', 'Lead times'
        ]

        # Only use columns that exist in the dataframe
        available_features = [col for col in feature_columns if col in df_copy.columns]
        X = df_copy[available_features]

        # Fill any missing values
        X = X.fillna(X.mean())

        return X

    def train(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Train the Isolation Forest model

        Args:
            df: Training data

        Returns:
            Dictionary with training information
        """
        logger.info("Preparing features for cost anomaly detection...")
        X = self.prepare_features(df)

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        logger.info("Training Isolation Forest model...")
        # Train the model
        self.model.fit(X_scaled)

        # Predict on training data to get anomaly scores
        anomaly_scores = self.model.decision_function(X_scaled)
        predictions = self.model.predict(X_scaled)

        # Calculate statistics
        n_anomalies = np.sum(predictions == -1)  # -1 indicates anomaly
        anomaly_percentage = (n_anomalies / len(predictions)) * 100

        results = {
            'n_samples': len(X),
            'n_anomalies_detected': n_anomalies,
            'anomaly_percentage': anomaly_percentage,
            'average_anomaly_score': np.mean(anomaly_scores),
            'min_anomaly_score': np.min(anomaly_scores),
            'max_anomaly_score': np.max(anomaly_scores)
        }

        logger.info(f"Training completed. Found {n_anomalies} anomalies ({anomaly_percentage:.2f}% of data)")

        self.is_trained = True
        return results

    def detect_anomalies(self, df: pd.DataFrame) -> np.ndarray:
        """
        Detect anomalies in the data

        Args:
            df: Input data for anomaly detection

        Returns:
            Array of anomaly predictions (-1 for anomaly, 1 for normal)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before detecting anomalies")

        X = self.prepare_features(df)
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def get_anomaly_scores(self, df: pd.DataFrame) -> np.ndarray:
        """
        Get anomaly scores for the data (lower scores indicate higher anomaly likelihood)

        Args:
            df: Input data for anomaly scoring

        Returns:
            Array of anomaly scores
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before getting anomaly scores")

        X = self.prepare_features(df)
        X_scaled = self.scaler.transform(X)
        return self.model.decision_function(X_scaled)

    def predict_single(self, cost_data: Dict[str, float]) -> Tuple[int, float]:
        """
        Predict if a single cost record is anomalous

        Args:
            cost_data: Dictionary with cost information

        Returns:
            Tuple of (prediction: -1 for anomaly/1 for normal, anomaly_score)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        # Create a single-row dataframe for prediction
        single_df = pd.DataFrame([cost_data])

        score = self.get_anomaly_scores(single_df)[0] if len(self.get_anomaly_scores(single_df)) > 0 else 0.0
        pred = self.detect_anomalies(single_df)[0] if len(self.detect_anomalies(single_df)) > 0 else 1

        return pred, score

    def save_model(self, filepath: str):
        """
        Save the trained model to disk

        Args:
            filepath: Path to save the model
        """
        model_data = {
            'model': self.model,
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
        instance.model = model_data['model']
        instance.scaler = model_data['scaler']
        instance.is_trained = model_data['is_trained']
        logger.info(f"Model loaded from {filepath}")
        return instance