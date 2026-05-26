# This file now serves as a compatibility wrapper for the enhanced insight engine
# The enhanced version is available at enhanced_insight_engine.py
from .enhanced_insight_engine import EnhancedInsightEngine as InsightEngine


def create_insight_engine(predictor=None):
    """
    Factory function to create an insight engine instance
    """
    return InsightEngine(predictor)