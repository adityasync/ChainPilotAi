import pandas as pd
import numpy as np
from datetime import datetime
import os
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)

def load_superstore_data(file_path: str) -> pd.DataFrame:
    """
    Load and perform initial parsing of the Superstore Sales Dataset

    Args:
        file_path: Path to the Superstore Sales Dataset CSV file

    Returns:
        DataFrame with parsed and cleaned data
    """
    df = pd.read_csv(file_path)

    # Parse dates - the date format appears to be DD/MM/YYYY
    df['Order Date'] = pd.to_datetime(df['Order Date'], format='%d/%m/%Y', errors='coerce')
    df['Ship Date'] = pd.to_datetime(df['Ship Date'], format='%d/%m/%Y', errors='coerce')

    logger.info(f"Loaded Superstore data with shape: {df.shape}")
    logger.info(f"Date range: {df['Order Date'].min()} to {df['Order Date'].max()}")

    return df


def load_supply_chain_data(file_path: str) -> pd.DataFrame:
    """
    Load and perform initial parsing of the supply chain dataset

    Args:
        file_path: Path to the supply chain CSV file

    Returns:
        DataFrame with parsed and cleaned data
    """
    df = pd.read_csv(file_path)

    logger.info(f"Loaded supply chain data with shape: {df.shape}")
    logger.info(f"Columns: {list(df.columns)}")

    return df


def preprocess_superstore_for_demand_forecasting(df: pd.DataFrame) -> pd.DataFrame:
    """
    Preprocess Superstore data for demand forecasting

    Args:
        df: Original Superstore dataframe

    Returns:
        DataFrame ready for demand forecasting
    """
    # Group by product and date to create demand time series
    demand_df = df.groupby(['Product ID', pd.Grouper(key='Order Date', freq='W')]).agg({
        'Sales': 'sum',
        'Order ID': 'count'
    }).reset_index()

    # Rename columns for clarity
    demand_df.rename(columns={'Order ID': 'Quantity'}, inplace=True)

    # Fill any missing values
    demand_df.fillna(0, inplace=True)

    # Sort by date
    demand_df.sort_values(['Product ID', 'Order Date'], inplace=True)

    logger.info(f"Demand forecasting dataset shape: {demand_df.shape}")

    return demand_df


def preprocess_supply_chain_for_classification(df: pd.DataFrame) -> pd.DataFrame:
    """
    Preprocess supply chain data for inventory risk classification and supplier delay prediction

    Args:
        df: Original supply chain dataframe

    Returns:
        DataFrame ready for classification tasks
    """
    processed_df = df.copy()

    # Create inventory risk labels based on availability and stock levels
    # Calculate ratio of number of products sold to availability
    processed_df['sales_to_availability_ratio'] = processed_df['Number of products sold'] / (
        processed_df['Availability'] + 1  # Adding 1 to avoid division by zero
    )

    # Create inventory risk labels
    def classify_inventory_risk(row):
        if row['Stock levels'] < 10:  # Low stock threshold
            return 'Stockout Risk'
        elif row['Stock levels'] > 100:  # High stock threshold
            return 'Overstock Risk'
        else:
            return 'Normal'

    processed_df['inventory_risk_label'] = processed_df.apply(classify_inventory_risk, axis=1)

    # Create delivery delay binary target (assuming Shipping times > Lead times indicates delay)
    processed_df['delivery_delay'] = (processed_df['Shipping times'] > processed_df['Lead times']).astype(int)

    # Normalize numerical features
    numerical_columns = ['Price', 'Availability', 'Number of products sold', 'Revenue generated',
                         'Stock levels', 'Lead times', 'Order quantities', 'Shipping costs']

    for col in numerical_columns:
        if col in processed_df.columns:
            # Min-max normalization
            min_val = processed_df[col].min()
            max_val = processed_df[col].max()
            if max_val != min_val:  # Avoid division by zero
                processed_df[f'{col}_normalized'] = (processed_df[col] - min_val) / (max_val - min_val)

    logger.info(f"Classification dataset shape: {processed_df.shape}")
    logger.info(f"Inventory risk distribution:\n{processed_df['inventory_risk_label'].value_counts()}")
    logger.info(f"Delivery delay distribution:\n{processed_df['delivery_delay'].value_counts()}")

    return processed_df


def create_sample_datasets(raw_dir: str, sample_dir: str) -> None:
    """
    Create sample datasets for testing (50-100 rows each)

    Args:
        raw_dir: Directory containing raw datasets
        sample_dir: Directory to save sample datasets
    """
    # Create sample from Superstore data
    superstore_path = os.path.join(raw_dir, "Superstore Sales Dataset.csv")
    if os.path.exists(superstore_path):
        df_superstore = load_superstore_data(superstore_path)
        sample_superstore = df_superstore.head(100)
        sample_superstore_path = os.path.join(sample_dir, "sample_superstore.csv")
        sample_superstore.to_csv(sample_superstore_path, index=False)
        logger.info(f"Created sample Superstore dataset with {len(sample_superstore)} rows")

        # Also create a demand forecasting sample
        demand_data = preprocess_superstore_for_demand_forecasting(df_superstore.head(200))
        demand_sample_path = os.path.join(sample_dir, "sample_demand_data.csv")
        demand_data.head(100).to_csv(demand_sample_path, index=False)
        logger.info(f"Created sample demand data with {len(demand_data.head(100))} rows")

    # Create sample from supply chain data
    supply_chain_path = os.path.join(raw_dir, "supply_chain_data.csv")
    if os.path.exists(supply_chain_path):
        df_supply = load_supply_chain_data(supply_chain_path)
        sample_supply = df_supply.head(100)
        sample_supply_path = os.path.join(sample_dir, "sample_supply_chain.csv")
        sample_supply.to_csv(sample_supply_path, index=False)
        logger.info(f"Created sample supply chain dataset with {len(sample_supply)} rows")

        # Also create a classification sample
        classification_data = preprocess_supply_chain_for_classification(df_supply.head(200))
        classification_sample_path = os.path.join(sample_dir, "sample_classification_data.csv")
        classification_data.head(100).to_csv(classification_sample_path, index=False)
        logger.info(f"Created sample classification data with {len(classification_data.head(100))} rows")


def save_processed_data(processed_data: Dict[str, pd.DataFrame], output_dir: str) -> None:
    """
    Save processed datasets to the processed directory

    Args:
        processed_data: Dictionary mapping dataset names to DataFrames
        output_dir: Directory to save processed datasets
    """
    os.makedirs(output_dir, exist_ok=True)

    for name, df in processed_data.items():
        file_path = os.path.join(output_dir, f"{name}.csv")
        df.to_csv(file_path, index=False)
        logger.info(f"Saved processed data '{name}' with shape {df.shape} to {file_path}")


def main_processing_pipeline(raw_dir: str = "data/raw", processed_dir: str = "data/processed",
                           sample_dir: str = "data/samples") -> Dict[str, pd.DataFrame]:
    """
    Main preprocessing pipeline that loads raw data, processes it, and saves it to appropriate directories

    Args:
        raw_dir: Directory containing raw datasets
        processed_dir: Directory to save processed datasets
        sample_dir: Directory to save sample datasets

    Returns:
        Dictionary of processed datasets
    """
    logger.info("Starting preprocessing pipeline...")

    processed_datasets = {}

    # Process Superstore data
    superstore_path = os.path.join(raw_dir, "Superstore Sales Dataset.csv")
    if os.path.exists(superstore_path):
        logger.info("Processing Superstore data...")
        df_superstore = load_superstore_data(superstore_path)

        # For demand forecasting
        demand_data = preprocess_superstore_for_demand_forecasting(df_superstore)
        processed_datasets["demand_data"] = demand_data

        logger.info("Superstore processing completed.")

    # Process supply chain data
    supply_chain_path = os.path.join(raw_dir, "supply_chain_data.csv")
    if os.path.exists(supply_chain_path):
        logger.info("Processing supply chain data...")
        df_supply = load_supply_chain_data(supply_chain_path)

        # For classification tasks
        classification_data = preprocess_supply_chain_for_classification(df_supply)
        processed_datasets["classification_data"] = classification_data

        logger.info("Supply chain processing completed.")

    # Save processed data
    save_processed_data(processed_datasets, processed_dir)

    # Create sample datasets
    create_sample_datasets(raw_dir, sample_dir)

    logger.info("Preprocessing pipeline completed.")

    return processed_datasets


if __name__ == "__main__":
    # For testing purposes
    import sys
    import os
    # Add the project root to the path so we can import other modules
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

    processed_data = main_processing_pipeline()
    print("Processed datasets:", list(processed_data.keys()))