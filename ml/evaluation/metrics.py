"""
Custom Metrics Utilities

This module provides custom evaluation metrics for supply chain ML models,
including domain-specific metrics and standard ML metrics wrappers.
"""

import numpy as np
from typing import List, Tuple, Optional, Union
import warnings


def calculate_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Calculate Mean Absolute Percentage Error.
    
    Args:
        y_true: Array of true values
        y_pred: Array of predicted values
    
    Returns:
        MAPE value (0-100 scale)
    
    Note:
        Excludes zero values in y_true to avoid division by zero.
    """
    y_true = np.array(y_true).flatten()
    y_pred = np.array(y_pred).flatten()
    
    # Avoid division by zero
    mask = y_true != 0
    if mask.sum() == 0:
        return np.nan
    
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100


def calculate_smape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Calculate Symmetric Mean Absolute Percentage Error.
    
    Args:
        y_true: Array of true values
        y_pred: Array of predicted values
    
    Returns:
        SMAPE value (0-100 scale)
    
    Note:
        More balanced than MAPE for values close to zero.
    """
    y_true = np.array(y_true).flatten()
    y_pred = np.array(y_pred).flatten()
    
    denominator = (np.abs(y_true) + np.abs(y_pred))
    
    # Avoid division by zero
    mask = denominator != 0
    if mask.sum() == 0:
        return 0.0
    
    return np.mean(2 * np.abs(y_true[mask] - y_pred[mask]) / denominator[mask]) * 100


def calculate_coverage(y_true: np.ndarray, y_pred_lower: np.ndarray, 
                       y_pred_upper: np.ndarray) -> float:
    """
    Calculate prediction interval coverage.
    
    Args:
        y_true: Array of true values
        y_pred_lower: Array of lower bound predictions
        y_pred_upper: Array of upper bound predictions
    
    Returns:
        Coverage percentage (0-100)
    """
    y_true = np.array(y_true).flatten()
    y_pred_lower = np.array(y_pred_lower).flatten()
    y_pred_upper = np.array(y_pred_upper).flatten()
    
    within_interval = (y_true >= y_pred_lower) & (y_true <= y_pred_upper)
    return np.mean(within_interval) * 100


def calculate_bias(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Calculate forecast bias (positive = over-forecasting).
    
    Args:
        y_true: Array of true values
        y_pred: Array of predicted values
    
    Returns:
        Bias value (mean of errors)
    """
    y_true = np.array(y_true).flatten()
    y_pred = np.array(y_pred).flatten()
    
    return np.mean(y_pred - y_true)


def calculate_stockout_rate(
    actual_demand: np.ndarray,
    available_stock: np.ndarray
) -> float:
    """
    Calculate stockout rate (domain-specific metric).
    
    Args:
        actual_demand: Array of actual demand values
        available_stock: Array of available stock values
    
    Returns:
        Stockout rate (0-100)
    """
    actual_demand = np.array(actual_demand).flatten()
    available_stock = np.array(available_stock).flatten()
    
    stockouts = actual_demand > available_stock
    return np.mean(stockouts) * 100


def calculate_fill_rate(
    fulfilled_demand: np.ndarray,
    total_demand: np.ndarray
) -> float:
    """
    Calculate order fill rate (domain-specific metric).
    
    Args:
        fulfilled_demand: Array of fulfilled demand values
        total_demand: Array of total demand values
    
    Returns:
        Fill rate (0-100)
    """
    fulfilled_demand = np.array(fulfilled_demand).flatten()
    total_demand = np.array(total_demand).flatten()
    
    total = total_demand.sum()
    if total == 0:
        return 100.0
    
    return (fulfilled_demand.sum() / total) * 100


def calculate_safety_stock_effectiveness(
    stockouts_before: int,
    stockouts_after: int
) -> float:
    """
    Calculate safety stock effectiveness.
    
    Args:
        stockouts_before: Number of stockouts before safety stock
        stockouts_after: Number of stockouts after safety stock
    
    Returns:
        Effectiveness percentage (reduction in stockouts)
    """
    if stockouts_before == 0:
        return 100.0 if stockouts_after == 0 else 0.0
    
    return ((stockouts_before - stockouts_after) / stockouts_before) * 100


def calculate_inventory_turnover(
    cost_of_goods_sold: float,
    average_inventory: float
) -> float:
    """
    Calculate inventory turnover ratio.
    
    Args:
        cost_of_goods_sold: Total COGS for the period
        average_inventory: Average inventory value
    
    Returns:
        Turnover ratio
    """
    if average_inventory == 0:
        return 0.0
    
    return cost_of_goods_sold / average_inventory


def calculate_supplier_reliability_score(
    on_time_deliveries: int,
    total_deliveries: int,
    quality_rate: float = 1.0,
    quantity_accuracy: float = 1.0
) -> float:
    """
    Calculate composite supplier reliability score.
    
    Args:
        on_time_deliveries: Number of on-time deliveries
        total_deliveries: Total number of deliveries
        quality_rate: Quality acceptance rate (0-1)
        quantity_accuracy: Quantity accuracy rate (0-1)
    
    Returns:
        Reliability score (0-100)
    """
    if total_deliveries == 0:
        return 0.0
    
    on_time_rate = on_time_deliveries / total_deliveries
    
    # Weighted composite score
    weights = {
        'on_time': 0.5,
        'quality': 0.3,
        'quantity': 0.2
    }
    
    score = (
        weights['on_time'] * on_time_rate +
        weights['quality'] * quality_rate +
        weights['quantity'] * quantity_accuracy
    )
    
    return score * 100


def calculate_prediction_accuracy_by_segment(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    segments: np.ndarray
) -> dict:
    """
    Calculate prediction accuracy by segment.
    
    Args:
        y_true: Array of true values
        y_pred: Array of predicted values
        segments: Array of segment labels
    
    Returns:
        Dictionary with metrics per segment
    """
    y_true = np.array(y_true).flatten()
    y_pred = np.array(y_pred).flatten()
    segments = np.array(segments).flatten()
    
    unique_segments = np.unique(segments)
    results = {}
    
    for segment in unique_segments:
        mask = segments == segment
        if mask.sum() == 0:
            continue
        
        segment_true = y_true[mask]
        segment_pred = y_pred[mask]
        
        results[str(segment)] = {
            'count': int(mask.sum()),
            'mae': float(np.mean(np.abs(segment_true - segment_pred))),
            'mape': float(calculate_mape(segment_true, segment_pred)),
            'rmse': float(np.sqrt(np.mean((segment_true - segment_pred) ** 2)))
        }
    
    return results


def calculate_anomaly_precision_at_k(
    true_anomalies: np.ndarray,
    anomaly_scores: np.ndarray,
    k: int
) -> float:
    """
    Calculate precision at k for anomaly detection.
    
    Args:
        true_anomalies: Binary array of true anomalies (1=anomaly)
        anomaly_scores: Array of anomaly scores
        k: Number of top predictions to consider
    
    Returns:
        Precision at k (0-1)
    """
    true_anomalies = np.array(true_anomalies).flatten()
    anomaly_scores = np.array(anomaly_scores).flatten()
    
    # Get top k indices by score (assuming higher score = more anomalous)
    top_k_indices = np.argsort(anomaly_scores)[-k:]
    
    # Calculate precision
    true_positives = true_anomalies[top_k_indices].sum()
    return true_positives / k


def calculate_confusion_matrix_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray
) -> dict:
    """
    Calculate comprehensive confusion matrix metrics.
    
    Args:
        y_true: Array of true labels
        y_pred: Array of predicted labels
    
    Returns:
        Dictionary with detailed metrics
    """
    y_true = np.array(y_true).flatten()
    y_pred = np.array(y_pred).flatten()
    
    # Binary classification assumption
    tp = np.sum((y_true == 1) & (y_pred == 1))
    tn = np.sum((y_true == 0) & (y_pred == 0))
    fp = np.sum((y_true == 0) & (y_pred == 1))
    fn = np.sum((y_true == 1) & (y_pred == 0))
    
    # Avoid division by zero
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        
        accuracy = (tp + tn) / (tp + tn + fp + fn)
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        # Matthews Correlation Coefficient
        mcc_num = (tp * tn) - (fp * fn)
        mcc_den = np.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
        mcc = mcc_num / mcc_den if mcc_den > 0 else 0
    
    return {
        'true_positives': int(tp),
        'true_negatives': int(tn),
        'false_positives': int(fp),
        'false_negatives': int(fn),
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'specificity': float(specificity),
        'f1_score': float(f1),
        'mcc': float(mcc)
    }


def calculate_weighted_accuracy(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    weights: np.ndarray
) -> float:
    """
    Calculate weighted accuracy.
    
    Args:
        y_true: Array of true labels
        y_pred: Array of predicted labels
        weights: Array of sample weights
    
    Returns:
        Weighted accuracy (0-1)
    """
    y_true = np.array(y_true).flatten()
    y_pred = np.array(y_pred).flatten()
    weights = np.array(weights).flatten()
    
    correct = y_true == y_pred
    return np.average(correct, weights=weights)


# Export all functions
__all__ = [
    'calculate_mape',
    'calculate_smape',
    'calculate_coverage',
    'calculate_bias',
    'calculate_stockout_rate',
    'calculate_fill_rate',
    'calculate_safety_stock_effectiveness',
    'calculate_inventory_turnover',
    'calculate_supplier_reliability_score',
    'calculate_prediction_accuracy_by_segment',
    'calculate_anomaly_precision_at_k',
    'calculate_confusion_matrix_metrics',
    'calculate_weighted_accuracy',
]
