from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
import logging
import json
from datetime import datetime, timedelta
from enum import Enum

from ...models.ml_models import Prediction, Insight
from ...models.product_inventory import Product
from ...models.supplier_shipment import Supplier

logger = logging.getLogger(__name__)


class InsightCategory(Enum):
    INVENTORY = "inventory"
    SUPPLIER = "supplier"
    COST = "cost"
    DEMAND = "demand"


class InsightStatus(Enum):
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    EXPIRED = "expired"


class InsightSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EnhancedInsightEngine:
    """
    Enhanced insight engine with classification, prioritization, explanations, and lifecycle management
    """

    def __init__(self, predictor=None):
        self.predictor = predictor

    def calculate_priority_score(
        self,
        severity: str,
        confidence: float,
        urgency: str,
        time_since_creation: timedelta
    ) -> float:
        """
        Calculate priority score based on multiple factors

        Args:
            severity: Severity level (low, medium, high, critical)
            confidence: Confidence score (0.0 to 1.0)
            urgency: Urgency level (low, medium, high, critical)
            time_since_creation: Time elapsed since insight creation

        Returns:
            Priority score (0.0 to 1.0)
        """
        # Base severity weights
        severity_weights = {
            'critical': 1.0,
            'high': 0.8,
            'medium': 0.5,
            'low': 0.2
        }

        # Urgency weights
        urgency_weights = {
            'critical': 1.0,
            'high': 0.8,
            'medium': 0.5,
            'low': 0.2
        }

        base_severity_weight = severity_weights.get(severity, 0.5)
        urgency_weight = urgency_weights.get(urgency, 0.5)

        # Factor in confidence score
        confidence_factor = confidence if confidence is not None else 0.5

        # Apply time decay (reduce priority over time)
        hours_old = time_since_creation.total_seconds() / 3600
        time_decay = max(0.1, 1.0 - (hours_old * 0.01))  # Reduce priority by 1% per hour

        # Calculate final score
        priority_score = (
            (base_severity_weight * 0.4) +
            (urgency_weight * 0.3) +
            (confidence_factor * 0.2) +
            (time_decay * 0.1)
        )

        return min(priority_score, 1.0)  # Cap at 1.0

    def generate_explanation(self, insight_data: Dict[str, Any]) -> str:
        """
        Generate human-readable explanation for an insight

        Args:
            insight_data: Dictionary containing insight information

        Returns:
            Human-readable explanation
        """
        category = insight_data.get('category', '')
        prediction_type = insight_data.get('prediction_type', '')
        prediction_value = insight_data.get('prediction_value', 0)
        entity_id = insight_data.get('entity_id', 'unknown')

        explanations = {
            ('inventory', 'inventory_risk'): f"Inventory risk detected for item {entity_id} due to current stock levels compared to predicted demand.",
            ('inventory', 'stockout_risk'): f"Stockout risk detected for item {entity_id} as predicted demand exceeds current stock by {abs(prediction_value)*100:.1f}%.",
            ('inventory', 'overstock_risk'): f"Overstock risk detected for item {entity_id} as current stock significantly exceeds projected demand.",
            ('supplier', 'delay_risk'): f"Supplier delay risk increased for supplier {entity_id} due to rising lead-time variance of {abs(prediction_value)*100:.1f}%.",
            ('supplier', 'performance_issue'): f"Performance issue detected for supplier {entity_id} based on recent delivery metrics.",
            ('cost', 'anomaly'): f"Abnormal cost pattern detected for record {entity_id} with anomaly score of {prediction_value:.3f}.",
            ('cost', 'inefficiency'): f"Potential cost inefficiency identified in operations related to record {entity_id}.",
            ('demand', 'high_forecast'): f"High demand forecast for product {entity_id} predicts {prediction_value:.1f} units needed.",
            ('demand', 'trend_change'): f"Demand trend change detected for product {entity_id} indicating shift in customer behavior."
        }

        key = (category, prediction_type)
        return explanations.get(key, f"An insight has been generated for {category} entity {entity_id} based on ML predictions.")

    def generate_recommended_action(self, insight_data: Dict[str, Any]) -> str:
        """
        Generate prescriptive recommendation for an insight

        Args:
            insight_data: Dictionary containing insight information

        Returns:
            Recommended action
        """
        category = insight_data.get('category', '')
        prediction_type = insight_data.get('prediction_type', '')
        prediction_value = insight_data.get('prediction_value', 0)
        entity_id = insight_data.get('entity_id', 'unknown')

        actions = {
            ('inventory', 'stockout_risk'): f"Reorder {round(abs(prediction_value) * 10)} units before the next cycle",
            ('inventory', 'overstock_risk'): f"Delay procurement for item {entity_id} for 7-14 days",
            ('supplier', 'delay_risk'): f"Consider alternative suppliers for next shipment to supplier {entity_id}",
            ('cost', 'anomaly'): f"Investigate and audit cost center related to record {entity_id}",
            ('demand', 'high_forecast'): f"Prepare to fulfill {round(prediction_value)} additional units in the coming period"
        }

        key = (category, prediction_type)
        return actions.get(key, f"Review and monitor {category} aspect related to entity {entity_id}")

    def generate_expected_impact(self, insight_data: Dict[str, Any]) -> str:
        """
        Generate expected impact statement for an insight

        Args:
            insight_data: Dictionary containing insight information

        Returns:
            Expected impact statement
        """
        category = insight_data.get('category', '')
        prediction_type = insight_data.get('prediction_type', '')
        prediction_value = insight_data.get('prediction_value', 0)

        impacts = {
            ('inventory', 'stockout_risk'): "Prevents potential stockouts and lost sales",
            ('inventory', 'overstock_risk'): "Reduces holding costs and frees up capital",
            ('supplier', 'delay_risk'): "Avoids potential delivery delays and supply disruptions",
            ('cost', 'anomaly'): "Identifies cost savings opportunities or fraud prevention",
            ('demand', 'high_forecast'): "Ensures adequate inventory to meet customer demand"
        }

        key = (category, prediction_type)
        return impacts.get(key, "Addressing this insight will improve operational efficiency")

    def deduplicate_insights(self, insights: List[Dict[str, Any]], existing_insights: List[Insight]) -> List[Dict[str, Any]]:
        """
        Remove duplicate insights based on similarity

        Args:
            insights: New insights to check
            existing_insights: Existing insights in the database

        Returns:
            List of non-duplicate insights
        """
        unique_insights = []

        for new_insight in insights:
            is_duplicate = False

            for existing_insight in existing_insights:
                # Parse entity_id from prediction_details json
                existing_details = {}
                if existing_insight.prediction_details:
                    try:
                        existing_details = json.loads(existing_insight.prediction_details)
                    except:
                        pass
                
                existing_entity_id = existing_details.get('entity_id')

                # Compare based on category, entity_id, and title
                # We interpret duplicate as same category/title for same entity
                if (existing_insight.category == new_insight['category'] and
                    str(existing_entity_id) == str(new_insight['entity_id']) and
                    existing_insight.title == new_insight['title']):

                    # Check if it's recent (less than 24 hours old)
                    time_diff = datetime.utcnow() - existing_insight.created_at.replace(tzinfo=None)
                    if time_diff < timedelta(hours=24):
                        is_duplicate = True
                        break

            if not is_duplicate:
                unique_insights.append(new_insight)

        return unique_insights

    def update_insight_lifecycle(self, db: Session, company_id: int):
        """
        Update insight statuses based on time and user actions

        Args:
            db: Database session
            company_id: Company ID to update insights for
        """
        # Get all non-resolved insights for the company
        insights = db.query(Insight).filter(
            Insight.company_id == company_id,
            Insight.status != 'resolved'
        ).all()

        current_time = datetime.utcnow()

        for insight in insights:
            time_since_created = current_time - insight.created_at.replace(tzinfo=None)

            # Auto-expire critical insights after 7 days if not resolved
            if insight.severity == 'critical' and time_since_created > timedelta(days=7):
                insight.status = 'expired'
                insight.expired_at = current_time

            # Auto-expire non-critical insights after 30 days if not resolved
            elif insight.severity in ['high', 'medium', 'low'] and time_since_created > timedelta(days=30):
                insight.status = 'expired'
                insight.expired_at = current_time

        db.commit()

    def create_enhanced_insight(self, insight_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create an enhanced insight with all required fields

        Args:
            insight_data: Basic insight information

        Returns:
            Complete enhanced insight data
        """
        # Set default values
        category = insight_data.get('category', 'general')
        prediction_type = insight_data.get('prediction_type', 'general')
        prediction_value = float(insight_data.get('prediction_value', 0.5))
        confidence = float(insight_data.get('confidence', 0.7))

        # Determine severity based on prediction type and value
        if prediction_type in ['stockout_risk', 'delay_risk', 'anomaly']:
            severity = 'high' if abs(prediction_value) > 0.7 else 'medium'
        elif prediction_type == 'critical':
            severity = 'critical'
        else:
            severity = insight_data.get('severity', 'medium')

        # Determine urgency
        if severity == 'critical':
            urgency = 'critical'
        elif severity == 'high':
            urgency = 'high'
        elif severity == 'medium':
            urgency = 'medium'
        else:
            urgency = 'low'

        # Generate enhanced fields
        explanation = self.generate_explanation(insight_data)
        recommended_action = self.generate_recommended_action(insight_data)
        expected_impact = self.generate_expected_impact(insight_data)

        # Calculate priority score
        time_since_creation = timedelta(0)  # For new insights
        priority_score = self.calculate_priority_score(
            severity, confidence, urgency, time_since_creation
        )

        # Create complete insight data
        enhanced_insight = {
            'company_id': insight_data['company_id'],
            'category': category,
            'title': insight_data['title'],
            'message': insight_data['message'],
            'severity': severity,
            'confidence_score': confidence,
            'explanation': explanation,
            'recommended_action': recommended_action,
            'expected_impact': expected_impact,
            'urgency_level': urgency,
            'priority_score': priority_score,
            'status': 'new',
            'prediction_details': insight_data.get('prediction_details', '{}'),
            'entity_type': insight_data.get('entity_type', category),
            'entity_id': insight_data['entity_id']
        }

        return enhanced_insight

    def save_enhanced_insights(
        self,
        db: Session,
        company_id: int,
        predictions_data: List[Dict[str, Any]],
        insights_data: List[Dict[str, Any]]
    ):
        """
        Save enhanced insights to the database with proper classification and lifecycle management

        Args:
            db: Database session
            company_id: ID of the company
            predictions_data: List of prediction dictionaries
            insights_data: List of basic insight dictionaries
        """
        # Get existing insights for deduplication
        existing_insights = db.query(Insight).filter(Insight.company_id == company_id).all()

        # Create enhanced insights
        enhanced_insights = []
        for insight_data in insights_data:
            enhanced_insight = self.create_enhanced_insight(insight_data)
            enhanced_insights.append(enhanced_insight)

        # Deduplicate insights
        unique_insights = self.deduplicate_insights(enhanced_insights, existing_insights)

        # Save predictions to the predictions table
        for pred_data in predictions_data:
            prediction = Prediction(
                company_id=pred_data['company_id'],
                entity_type=pred_data['entity_type'],
                entity_id=pred_data['entity_id'],
                prediction_type=pred_data['prediction_type'],
                prediction_value=pred_data['prediction_value']
            )
            db.add(prediction)

        # Save enhanced insights to the insights table
        for insight_data in unique_insights:
            insight = Insight(
                company_id=insight_data['company_id'],
                category=insight_data['category'],
                title=insight_data['title'],
                message=insight_data['message'],
                severity=insight_data['severity'],
                confidence_score=insight_data['confidence_score'],
                explanation=insight_data['explanation'],
                recommended_action=insight_data['recommended_action'],
                expected_impact=insight_data['expected_impact'],
                urgency_level=insight_data['urgency_level'],
                priority_score=insight_data['priority_score'],
                status=insight_data['status'],
                prediction_details=insight_data['prediction_details'],
                # entity_type and entity_id are not in Insight model, so we exclude them
                # They are preserved in the message/title or implicitly via prediction_details
            )
            db.add(insight)

        # Commit the transactions
        db.commit()

    def run_enhanced_analysis(
        self,
        db: Session,
        company_id: int,
        product_data: List[Dict[str, Any]] = None,
        supplier_data: List[Dict[str, Any]] = None,
        cost_data: List[Dict[str, Any]] = None,
        demand_data: List[Dict[str, Any]] = None
    ):
        """
        Run an enhanced ML analysis with full insight generation

        Args:
            db: Database session
            company_id: ID of the company
            product_data: Product data for inventory risk analysis
            supplier_data: Supplier data for delay prediction
            cost_data: Cost data for anomaly detection
            demand_data: Demand data for forecasting
        """
        logger.info(f"Running enhanced ML analysis for company {company_id}")

        all_predictions = []
        all_insights = []

        # Run inventory risk analysis if product data is provided
        if product_data and self.predictor and 'inventory_risk_classifier' in self.predictor.models:
            logger.info("Running enhanced inventory risk analysis...")
            for product in product_data:
                try:
                    risk_label, probas = self.predictor.predict_inventory_risk(product)
                    product_id = product.get('id', 'unknown')
                    confidence = max(probas) if probas else 0.7

                    # Add to predictions list
                    all_predictions.append({
                        'company_id': company_id,
                        'entity_type': 'product',
                        'entity_id': product_id,
                        'prediction_type': 'inventory_risk',
                        'prediction_value': float(confidence)
                    })

                    # Create insight based on risk label
                    if risk_label == "Stockout Risk":
                        insight_data = {
                            'company_id': company_id,
                            'category': 'inventory',
                            'entity_type': 'product',
                            'entity_id': product_id,
                            'title': f'Stockout Risk for Product {product_id}',
                            'message': f'Product {product_id} is at risk of stockout based on current inventory and predicted demand',
                            'prediction_type': 'stockout_risk',
                            'prediction_value': confidence,
                            'confidence': confidence
                        }
                    elif risk_label == "Overstock Risk":
                        insight_data = {
                            'company_id': company_id,
                            'category': 'inventory',
                            'entity_type': 'product',
                            'entity_id': product_id,
                            'title': f'Overstock Risk for Product {product_id}',
                            'message': f'Product {product_id} is at risk of overstock based on current inventory levels',
                            'prediction_type': 'overstock_risk',
                            'prediction_value': -confidence,  # Negative for overstock
                            'confidence': confidence
                        }
                    else:  # Normal
                        continue  # Skip normal risks

                    all_insights.append(insight_data)
                except Exception as e:
                    logger.error(f"Error predicting inventory risk for product: {str(e)}")

        # Run supplier delay analysis if supplier data is provided
        if supplier_data and self.predictor and 'supplier_delay_predictor' in self.predictor.models:
            logger.info("Running enhanced supplier delay analysis...")
            for supplier in supplier_data:
                try:
                    delay_pred, delay_proba = self.predictor.predict_supplier_delay(supplier)
                    supplier_id = supplier.get('id', 'unknown')

                    # Add to predictions list
                    all_predictions.append({
                        'company_id': company_id,
                        'entity_type': 'supplier',
                        'entity_id': supplier_id,
                        'prediction_type': 'delay_risk',
                        'prediction_value': float(delay_proba)
                    })

                    # Create insight if high delay probability
                    if delay_pred == 1 and delay_proba > 0.5:
                        insight_data = {
                            'company_id': company_id,
                            'category': 'supplier',
                            'entity_type': 'supplier',
                            'entity_id': supplier_id,
                            'title': f'High Delay Risk for Supplier {supplier_id}',
                            'message': f'Supplier {supplier_id} has {(delay_proba * 100):.1f}% probability of delivery delay',
                            'prediction_type': 'delay_risk',
                            'prediction_value': delay_proba,
                            'confidence': delay_proba
                        }
                        all_insights.append(insight_data)
                except Exception as e:
                    logger.error(f"Error predicting supplier delay: {str(e)}")

        # Run cost anomaly analysis if cost data is provided
        if cost_data and self.predictor and 'cost_anomaly_detector' in self.predictor.models:
            logger.info("Running enhanced cost anomaly analysis...")
            for cost_record in cost_data:
                try:
                    anomaly_pred, anomaly_score = self.predictor.detect_cost_anomaly(cost_record)
                    record_id = cost_record.get('id', 'unknown')

                    # Add to predictions list
                    all_predictions.append({
                        'company_id': company_id,
                        'entity_type': 'cost',
                        'entity_id': record_id,
                        'prediction_type': 'cost_anomaly',
                        'prediction_value': anomaly_score
                    })

                    # Create insight if anomaly detected
                    if anomaly_pred == -1:
                        insight_data = {
                            'company_id': company_id,
                            'category': 'cost',
                            'entity_type': 'cost',
                            'entity_id': record_id,
                            'title': f'Cost Anomaly Detected - Record {record_id}',
                            'message': f'A cost anomaly has been detected with score {anomaly_score:.3f}',
                            'prediction_type': 'anomaly',
                            'prediction_value': anomaly_score,
                            'confidence': abs(anomaly_score)  # Use absolute value for confidence
                        }
                        all_insights.append(insight_data)
                except Exception as e:
                    logger.error(f"Error detecting cost anomaly: {str(e)}")

        # Run demand forecasting if demand data is provided
        if demand_data and self.predictor and 'demand_forecasting' in self.predictor.models:
            logger.info("Running enhanced demand forecasting...")
            for demand_record in demand_data:
                try:
                    product_id = demand_record.get('product_id', 'unknown')
                    date = demand_record.get('date', datetime.now())
                    predicted_demand = self.predictor.predict_demand(product_id, date)

                    # Add to predictions list
                    all_predictions.append({
                        'company_id': company_id,
                        'entity_type': 'product',
                        'entity_id': product_id,
                        'prediction_type': 'demand_forecast',
                        'prediction_value': predicted_demand
                    })

                    # Create insight if high demand
                    if predicted_demand > 50:  # Threshold for high demand
                        insight_data = {
                            'company_id': company_id,
                            'category': 'demand',
                            'entity_type': 'product',
                            'entity_id': product_id,
                            'title': f'High Demand Forecast for Product {product_id}',
                            'message': f'Product {product_id} is forecasted to have high demand of {predicted_demand:.1f} units',
                            'prediction_type': 'high_forecast',
                            'prediction_value': predicted_demand,
                            'confidence': 0.8  # High confidence in trend continuation
                        }
                        all_insights.append(insight_data)
                except Exception as e:
                    logger.error(f"Error forecasting demand: {str(e)}")

        # Save all enhanced predictions and insights to the database
        if all_predictions or all_insights:
            self.save_enhanced_insights(db, company_id, all_predictions, all_insights)
            logger.info(f"Saved {len(all_predictions)} predictions and {len(all_insights)} enhanced insights to database")

        # Update lifecycle for existing insights
        self.update_insight_lifecycle(db, company_id)

        return {
            'predictions_count': len(all_predictions),
            'insights_count': len(all_insights),
            'predictions': all_predictions,
            'insights': all_insights
        }

    def get_prioritized_insights(
        self,
        db: Session,
        company_id: int,
        status: str = None,
        severity: str = None,
        category: str = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get prioritized insights based on various filters

        Args:
            db: Database session
            company_id: Company ID
            status: Filter by status (new, acknowledged, resolved, expired)
            severity: Filter by severity (low, medium, high, critical)
            category: Filter by category (inventory, supplier, cost, demand)
            limit: Maximum number of insights to return

        Returns:
            List of prioritized insights
        """
        query = db.query(Insight).filter(Insight.company_id == company_id)

        if status:
            query = query.filter(Insight.status == status)
        if severity:
            query = query.filter(Insight.severity == severity)
        if category:
            query = query.filter(Insight.category == category)

        # Order by priority score descending, then by creation date
        insights = query.order_by(
            Insight.priority_score.desc(),
            Insight.created_at.desc()
        ).limit(limit).all()

        return [{
            "id": insight.id,
            "category": insight.category,
            "title": insight.title,
            "message": insight.message,
            "severity": insight.severity,
            "explanation": insight.explanation,
            "recommended_action": insight.recommended_action,
            "expected_impact": insight.expected_impact,
            "urgency_level": insight.urgency_level,
            "priority_score": insight.priority_score,
            "status": insight.status,
            "confidence_score": insight.confidence_score,
            "created_at": insight.created_at,
            "acknowledged_at": insight.acknowledged_at,
            "resolved_at": insight.resolved_at
        } for insight in insights]

    def acknowledge_insight(self, db: Session, insight_id: int, company_id: int):
        """
        Acknowledge an insight (mark as seen)

        Args:
            db: Database session
            insight_id: ID of the insight
            company_id: Company ID for security check
        """
        insight = db.query(Insight).filter(
            Insight.id == insight_id,
            Insight.company_id == company_id
        ).first()

        if not insight:
            raise ValueError("Insight not found or does not belong to company")

        insight.status = "acknowledged"
        insight.acknowledged_at = datetime.utcnow()
        db.commit()

    def resolve_insight(self, db: Session, insight_id: int, company_id: int):
        """
        Resolve an insight (mark as addressed)

        Args:
            db: Database session
            insight_id: ID of the insight
            company_id: Company ID for security check
        """
        insight = db.query(Insight).filter(
            Insight.id == insight_id,
            Insight.company_id == company_id
        ).first()

        if not insight:
            raise ValueError("Insight not found or does not belong to company")

        insight.status = "resolved"
        insight.resolved_at = datetime.utcnow()
        db.commit()