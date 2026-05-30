from sqlalchemy import select, case
from sqlalchemy.ext.asyncio import AsyncSession
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
        severity_weights = {
            'critical': 1.0,
            'high': 0.8,
            'medium': 0.5,
            'low': 0.2
        }
        urgency_weights = {
            'critical': 1.0,
            'high': 0.8,
            'medium': 0.5,
            'low': 0.2
        }

        base_severity_weight = severity_weights.get(severity, 0.5)
        urgency_weight = urgency_weights.get(urgency, 0.5)
        confidence_factor = confidence if confidence is not None else 0.5

        hours_old = time_since_creation.total_seconds() / 3600
        time_decay = max(0.1, 1.0 - (hours_old * 0.01))

        priority_score = (
            (base_severity_weight * 0.4) +
            (urgency_weight * 0.3) +
            (confidence_factor * 0.2) +
            (time_decay * 0.1)
        )

        return min(priority_score, 1.0)

    def generate_explanation(self, insight_data: Dict[str, Any]) -> str:
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
            ('demand', 'trend_change'): f"Demand trend change detected for product {entity_id} indicating shift in customer behavior.",
            ('demand', 'demand_anomaly'): f"Unusual demand pattern detected for product {entity_id}: actual demand deviated {abs(prediction_value):.1f} standard deviations from expected.",
            ('demand', 'demand_pattern_change'): f"Demand pattern for product {entity_id} has shifted, requiring updated forecasting approach.",
        }

        key = (category, prediction_type)
        return explanations.get(key, f"An insight has been generated for {category} entity {entity_id} based on ML predictions.")

    def generate_recommended_action(self, insight_data: Dict[str, Any]) -> str:
        category = insight_data.get('category', '')
        prediction_type = insight_data.get('prediction_type', '')
        prediction_value = insight_data.get('prediction_value', 0)
        entity_id = insight_data.get('entity_id', 'unknown')

        actions = {
            ('inventory', 'stockout_risk'): f"Reorder {round(abs(prediction_value) * 10)} units before the next cycle",
            ('inventory', 'overstock_risk'): f"Delay procurement for item {entity_id} for 7-14 days",
            ('supplier', 'delay_risk'): f"Consider alternative suppliers for next shipment to supplier {entity_id}",
            ('cost', 'anomaly'): f"Investigate and audit cost center related to record {entity_id}",
            ('demand', 'high_forecast'): f"Prepare to fulfill {round(prediction_value)} additional units in the coming period",
            ('demand', 'demand_anomaly'): f"Investigate root cause of demand anomaly for product {entity_id} and adjust forecasts accordingly",
            ('demand', 'demand_pattern_change'): f"Review and update demand planning strategy for product {entity_id}",
        }

        key = (category, prediction_type)
        return actions.get(key, f"Review and monitor {category} aspect related to entity {entity_id}")

    def generate_expected_impact(self, insight_data: Dict[str, Any]) -> str:
        category = insight_data.get('category', '')
        prediction_type = insight_data.get('prediction_type', '')
        prediction_value = insight_data.get('prediction_value', 0)

        impacts = {
            ('inventory', 'stockout_risk'): "Prevents potential stockouts and lost sales",
            ('inventory', 'overstock_risk'): "Reduces holding costs and frees up capital",
            ('supplier', 'delay_risk'): "Avoids potential delivery delays and supply disruptions",
            ('cost', 'anomaly'): "Identifies cost savings opportunities or fraud prevention",
            ('demand', 'high_forecast'): "Ensures adequate inventory to meet customer demand",
            ('demand', 'demand_anomaly'): "Improves forecast accuracy by identifying unusual demand patterns",
            ('demand', 'demand_pattern_change'): "Adapts supply chain strategy to evolving demand characteristics",
        }

        key = (category, prediction_type)
        return impacts.get(key, "Addressing this insight will improve operational efficiency")

    def deduplicate_insights(self, insights: List[Dict[str, Any]], existing_insights: List[Insight]) -> List[Dict[str, Any]]:
        unique_insights = []

        for new_insight in insights:
            is_duplicate = False

            for existing_insight in existing_insights:
                existing_details = {}
                if existing_insight.prediction_details:
                    try:
                        existing_details = json.loads(existing_insight.prediction_details)
                    except:
                        pass

                existing_entity_id = existing_details.get('entity_id')

                if (existing_insight.category == new_insight['category'] and
                    str(existing_entity_id) == str(new_insight['entity_id']) and
                    existing_insight.title == new_insight['title']):

                    time_diff = datetime.utcnow() - existing_insight.created_at.replace(tzinfo=None)
                    if time_diff < timedelta(hours=24):
                        is_duplicate = True
                        break

            if not is_duplicate:
                unique_insights.append(new_insight)

        return unique_insights

    async def update_insight_lifecycle(self, db: AsyncSession, company_id: int):
        result = await db.execute(
            select(Insight).filter(
                Insight.company_id == company_id,
                Insight.status != 'resolved'
            )
        )
        insights = result.scalars().all()

        current_time = datetime.utcnow()

        for insight in insights:
            time_since_created = current_time - insight.created_at.replace(tzinfo=None)

            if insight.severity == 'critical' and time_since_created > timedelta(days=7):
                insight.status = 'expired'
                insight.expired_at = current_time
            elif insight.severity in ['high', 'medium', 'low'] and time_since_created > timedelta(days=30):
                insight.status = 'expired'
                insight.expired_at = current_time

        await db.commit()

    def create_enhanced_insight(self, insight_data: Dict[str, Any]) -> Dict[str, Any]:
        category = insight_data.get('category', 'general')
        prediction_type = insight_data.get('prediction_type', 'general')
        prediction_value = float(insight_data.get('prediction_value', 0.5))
        confidence = float(insight_data.get('confidence', 0.7))

        if prediction_type in ['stockout_risk', 'delay_risk', 'anomaly']:
            severity = 'high' if abs(prediction_value) > 0.7 else 'medium'
        elif prediction_type == 'critical':
            severity = 'critical'
        else:
            severity = insight_data.get('severity', 'medium')

        if severity == 'critical':
            urgency = 'critical'
        elif severity == 'high':
            urgency = 'high'
        elif severity == 'medium':
            urgency = 'medium'
        else:
            urgency = 'low'

        explanation = self.generate_explanation(insight_data)
        recommended_action = self.generate_recommended_action(insight_data)
        expected_impact = self.generate_expected_impact(insight_data)

        time_since_creation = timedelta(0)
        priority_score = self.calculate_priority_score(
            severity, confidence, urgency, time_since_creation
        )

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

    async def save_enhanced_insights(
        self,
        db: AsyncSession,
        company_id: int,
        predictions_data: List[Dict[str, Any]],
        insights_data: List[Dict[str, Any]]
    ):
        result = await db.execute(select(Insight).filter(Insight.company_id == company_id))
        existing_insights = result.scalars().all()

        enhanced_insights = []
        for insight_data in insights_data:
            enhanced_insight = self.create_enhanced_insight(insight_data)
            enhanced_insights.append(enhanced_insight)

        unique_insights = self.deduplicate_insights(enhanced_insights, existing_insights)

        for pred_data in predictions_data:
            prediction = Prediction(
                company_id=pred_data['company_id'],
                entity_type=pred_data['entity_type'],
                entity_id=pred_data['entity_id'],
                prediction_type=pred_data['prediction_type'],
                prediction_value=pred_data['prediction_value']
            )
            db.add(prediction)

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
            )
            db.add(insight)

        await db.commit()

    async def run_enhanced_analysis(
        self,
        db: AsyncSession,
        company_id: int,
        product_data: List[Dict[str, Any]] = None,
        supplier_data: List[Dict[str, Any]] = None,
        cost_data: List[Dict[str, Any]] = None,
        demand_data: List[Dict[str, Any]] = None
    ):
        logger.info(f"Running enhanced ML analysis for company {company_id}")

        all_predictions = []
        all_insights = []

        if product_data and self.predictor and 'inventory_risk_classifier' in self.predictor.models:
            logger.info("Running enhanced inventory risk analysis...")
            for product in product_data:
                try:
                    risk_label, probas = self.predictor.predict_inventory_risk(product)
                    product_id = product.get('id', 'unknown')
                    confidence = max(probas) if probas else 0.7

                    all_predictions.append({
                        'company_id': company_id,
                        'entity_type': 'product',
                        'entity_id': product_id,
                        'prediction_type': 'inventory_risk',
                        'prediction_value': float(confidence)
                    })

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
                            'prediction_value': -confidence,
                            'confidence': confidence
                        }
                    else:
                        continue

                    all_insights.append(insight_data)
                except Exception as e:
                    logger.error(f"Error predicting inventory risk for product: {str(e)}")

        if supplier_data and self.predictor and 'supplier_delay_predictor' in self.predictor.models:
            logger.info("Running enhanced supplier delay analysis...")
            for supplier in supplier_data:
                try:
                    delay_pred, delay_proba = self.predictor.predict_supplier_delay(supplier)
                    supplier_id = supplier.get('id', 'unknown')

                    all_predictions.append({
                        'company_id': company_id,
                        'entity_type': 'supplier',
                        'entity_id': supplier_id,
                        'prediction_type': 'delay_risk',
                        'prediction_value': float(delay_proba)
                    })

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

        if cost_data and self.predictor and 'cost_anomaly_detector' in self.predictor.models:
            logger.info("Running enhanced cost anomaly analysis...")
            for cost_record in cost_data:
                try:
                    anomaly_pred, anomaly_score = self.predictor.detect_cost_anomaly(cost_record)
                    record_id = cost_record.get('id', 'unknown')

                    all_predictions.append({
                        'company_id': company_id,
                        'entity_type': 'cost',
                        'entity_id': record_id,
                        'prediction_type': 'cost_anomaly',
                        'prediction_value': anomaly_score
                    })

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
                            'confidence': abs(anomaly_score)
                        }
                        all_insights.append(insight_data)
                except Exception as e:
                    logger.error(f"Error detecting cost anomaly: {str(e)}")

        if demand_data and self.predictor and 'demand_forecasting' in self.predictor.models:
            logger.info("Running enhanced demand forecasting...")
            for demand_record in demand_data:
                try:
                    product_id = demand_record.get('product_id', 'unknown')
                    date = demand_record.get('date', datetime.now())
                    predicted_demand = self.predictor.predict_demand(product_id, date)

                    all_predictions.append({
                        'company_id': company_id,
                        'entity_type': 'product',
                        'entity_id': product_id,
                        'prediction_type': 'demand_forecast',
                        'prediction_value': predicted_demand
                    })

                    if predicted_demand > 50:
                        insight_data = {
                            'company_id': company_id,
                            'category': 'demand',
                            'entity_type': 'product',
                            'entity_id': product_id,
                            'title': f'High Demand Forecast for Product {product_id}',
                            'message': f'Product {product_id} is forecasted to have high demand of {predicted_demand:.1f} units',
                            'prediction_type': 'high_forecast',
                            'prediction_value': predicted_demand,
                            'confidence': 0.8
                        }
                        all_insights.append(insight_data)
                except Exception as e:
                    logger.error(f"Error forecasting demand: {str(e)}")

        # ML-powered demand analysis (anomalies, pattern classification)
        if demand_data:
            logger.info("Running ML demand anomaly and pattern analysis...")
            from ...services.demand_service import _fetch_orders_raw, _is_sufficient_data
            from ...models.ml_demand_forecaster import MLDemandForecaster as MLDemand

            for demand_record in demand_data:
                try:
                    product_id = demand_record.get('product_id')
                    if not product_id:
                        continue

                    raw_orders = await _fetch_orders_raw(db, company_id, product_id)
                    if not _is_sufficient_data(raw_orders):
                        continue

                    ml = MLDemand()
                    fc = ml.forecast(raw_orders, periods_ahead=1)

                    # Create insight for anomalies
                    for anomaly in fc.get('anomalies', []):
                        deviation = abs(anomaly['deviation'])
                        if deviation > 2.5:
                            insight_data = {
                                'company_id': company_id,
                                'category': 'demand',
                                'entity_type': 'product',
                                'entity_id': product_id,
                                'title': f'Demand Anomaly: {anomaly["direction"].title()} for Product {product_id}',
                                'message': f'Demand for product {product_id} in {anomaly["month"]} was {deviation:.1f}σ {anomaly["direction"]} from expected ({anomaly["actual"]:.0f} vs {anomaly["expected"]:.0f})',
                                'prediction_type': 'demand_anomaly',
                                'prediction_value': deviation,
                                'confidence': min(0.95, deviation / 4),
                            }
                            all_insights.append(insight_data)
                            all_predictions.append({
                                'company_id': company_id,
                                'entity_type': 'product',
                                'entity_id': product_id,
                                'prediction_type': 'demand_anomaly',
                                'prediction_value': deviation,
                            })

                    # Create insight for erratic demand pattern
                    pattern = fc.get('demand_pattern', {})
                    if pattern.get('pattern') == 'erratic' and pattern.get('confidence', 0) > 0.6:
                        insight_data = {
                            'company_id': company_id,
                            'category': 'demand',
                            'entity_type': 'product',
                            'entity_id': product_id,
                            'title': f'Erratic Demand Pattern: Product {product_id}',
                            'message': f'Product {product_id} has erratic demand ({pattern["description"]}). Consider safety stock or demand smoothing.',
                            'prediction_type': 'demand_pattern_change',
                            'prediction_value': pattern['confidence'],
                            'confidence': pattern['confidence'],
                        }
                        all_insights.append(insight_data)

                except Exception as e:
                    logger.warning(f"Error in ML demand analysis for product {demand_record.get('product_id')}: {str(e)}")

        if all_predictions or all_insights:
            await self.save_enhanced_insights(db, company_id, all_predictions, all_insights)
            logger.info(f"Saved {len(all_predictions)} predictions and {len(all_insights)} enhanced insights to database")

        await self.update_insight_lifecycle(db, company_id)

        return {
            'predictions_count': len(all_predictions),
            'insights_count': len(all_insights),
            'predictions': all_predictions,
            'insights': all_insights
        }

    async def get_prioritized_insights(
        self,
        db: AsyncSession,
        company_id: int,
        status: str = None,
        severity: str = None,
        category: str = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        query = select(Insight).filter(Insight.company_id == company_id)

        if status:
            query = query.filter(Insight.status == status)
        if severity:
            query = query.filter(Insight.severity == severity)
        if category:
            query = query.filter(Insight.category == category)

        severity_order = case(
            (Insight.severity == "critical", 4),
            (Insight.severity == "high", 3),
            (Insight.severity == "medium", 2),
            (Insight.severity == "low", 1),
            else_=0,
        )
        query = query.order_by(
            severity_order.desc(),
            Insight.priority_score.desc(),
            Insight.created_at.desc()
        ).limit(limit)

        result = await db.execute(query)
        insights = result.scalars().all()

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

    async def acknowledge_insight(self, db: AsyncSession, insight_id: int, company_id: int):
        result = await db.execute(
            select(Insight).filter(
                Insight.id == insight_id,
                Insight.company_id == company_id
            )
        )
        insight = result.scalars().first()

        if not insight:
            raise ValueError("Insight not found or does not belong to company")

        insight.status = "acknowledged"
        insight.acknowledged_at = datetime.utcnow()
        await db.commit()

    async def resolve_insight(self, db: AsyncSession, insight_id: int, company_id: int):
        result = await db.execute(
            select(Insight).filter(
                Insight.id == insight_id,
                Insight.company_id == company_id
            )
        )
        insight = result.scalars().first()

        if not insight:
            raise ValueError("Insight not found or does not belong to company")

        insight.status = "resolved"
        insight.resolved_at = datetime.utcnow()
        await db.commit()
