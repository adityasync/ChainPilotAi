# This file makes the evaluation directory a Python package

from .enhanced_insight_engine import EnhancedInsightEngine as InsightEngine
from .explanation_generator import get_explanation_and_recommendation, ExplanationGenerator, RecommendationGenerator


def create_insight_engine(predictor=None):
    """
    Factory function to create an insight engine instance
    """
    return InsightEngine(predictor)