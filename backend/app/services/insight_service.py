from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from ..models.ml_models import Insight
from ..ml.evaluation.enhanced_insight_engine import EnhancedInsightEngine
from ..ml.inference.predictor import MLPredictor

logger = logging.getLogger(__name__)

# Global instances
predictor = MLPredictor()
insight_engine = EnhancedInsightEngine(predictor)


def get_prioritized_insights(
    db: Session,
    company_id: int,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get prioritized insights for the frontend

    Args:
        db: Database session
        company_id: Company ID to filter insights
        status: Filter by status (new, acknowledged, resolved, expired)
        severity: Filter by severity (low, medium, high, critical)
        category: Filter by category (inventory, supplier, cost, demand)
        limit: Maximum number of insights to return

    Returns:
        List of prioritized insights
    """
    return insight_engine.get_prioritized_insights(
        db=db,
        company_id=company_id,
        status=status,
        severity=severity,
        category=category,
        limit=limit
    )


def get_action_required_insights(
    db: Session,
    company_id: int,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Get insights that require immediate action (high and critical severity)

    Args:
        db: Database session
        company_id: Company ID to filter insights
        limit: Maximum number of insights to return

    Returns:
        List of action-required insights
    """
    critical_insights = insight_engine.get_prioritized_insights(
        db=db,
        company_id=company_id,
        severity="critical",
        limit=limit
    )

    high_insights = insight_engine.get_prioritized_insights(
        db=db,
        company_id=company_id,
        severity="high",
        limit=limit
    )

    # Combine and sort by priority
    all_action_insights = critical_insights + high_insights
    all_action_insights.sort(key=lambda x: x['priority_score'], reverse=True)

    return all_action_insights[:limit]


def acknowledge_insight(
    db: Session,
    insight_id: int,
    company_id: int
) -> bool:
    """
    Acknowledge an insight (mark as seen)

    Args:
        db: Database session
        insight_id: ID of the insight to acknowledge
        company_id: Company ID for security check

    Returns:
        True if successful, False otherwise
    """
    try:
        insight_engine.acknowledge_insight(db, insight_id, company_id)
        return True
    except Exception as e:
        logger.error(f"Error acknowledging insight {insight_id}: {str(e)}")
        return False


def resolve_insight(
    db: Session,
    insight_id: int,
    company_id: int
) -> bool:
    """
    Resolve an insight (mark as addressed)

    Args:
        db: Database session
        insight_id: ID of the insight to resolve
        company_id: Company ID for security check

    Returns:
        True if successful, False otherwise
    """
    try:
        insight_engine.resolve_insight(db, insight_id, company_id)
        return True
    except Exception as e:
        logger.error(f"Error resolving insight {insight_id}: {str(e)}")
        return False


def run_enhanced_analysis(
    db: Session,
    company_id: int,
    product_data: List[Dict[str, Any]] = None,
    supplier_data: List[Dict[str, Any]] = None,
    cost_data: List[Dict[str, Any]] = None,
    demand_data: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Run an enhanced ML analysis for the company

    Args:
        db: Database session
        company_id: Company ID
        product_data: Product data for inventory risk analysis
        supplier_data: Supplier data for delay prediction
        cost_data: Cost data for anomaly detection
        demand_data: Demand data for forecasting

    Returns:
        Results of the analysis
    """
    try:
        results = insight_engine.run_enhanced_analysis(
            db=db,
            company_id=company_id,
            product_data=product_data,
            supplier_data=supplier_data,
            cost_data=cost_data,
            demand_data=demand_data
        )
        return results
    except Exception as e:
        logger.error(f"Error running enhanced analysis for company {company_id}: {str(e)}")
        raise


def get_insight_summary(
    db: Session,
    company_id: int
) -> Dict[str, Any]:
    """
    Get a summary of insights for dashboard display

    Args:
        db: Database session
        company_id: Company ID

    Returns:
        Summary of insights by category and severity
    """
    from sqlalchemy import func

    # Get counts by severity
    severity_counts = db.query(
        Insight.severity,
        func.count(Insight.id).label('count')
    ).filter(
        Insight.company_id == company_id,
        Insight.status != 'resolved'
    ).group_by(Insight.severity).all()

    # Get counts by category
    category_counts = db.query(
        Insight.category,
        func.count(Insight.id).label('count')
    ).filter(
        Insight.company_id == company_id,
        Insight.status != 'resolved'
    ).group_by(Insight.category).all()

    # Get counts by status
    status_counts = db.query(
        Insight.status,
        func.count(Insight.id).label('count')
    ).filter(Insight.company_id == company_id).group_by(Insight.status).all()

    # Get action-required count
    action_required_count = db.query(func.count(Insight.id)).filter(
        Insight.company_id == company_id,
        Insight.severity.in_(['high', 'critical']),
        Insight.status.in_(['new', 'acknowledged'])
    ).scalar()

    return {
        "total_insights": sum(count for _, count in severity_counts),
        "action_required": action_required_count,
        "by_severity": {severity: count for severity, count in severity_counts},
        "by_category": {category: count for category, count in category_counts},
        "by_status": {status: count for status, count in status_counts}
    }