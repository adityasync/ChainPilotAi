from typing import Dict, Any, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ExplanationGenerator:
    """
    Generates human-readable explanations for ML predictions and insights
    """

    @staticmethod
    def generate_inventory_explanation(
        product_id: str,
        current_stock: int,
        reorder_point: int,
        predicted_demand: float,
        risk_type: str
    ) -> str:
        """
        Generate explanation for inventory-related insights

        Args:
            product_id: ID of the product
            current_stock: Current stock level
            reorder_point: Reorder point for the product
            predicted_demand: Predicted demand for the product
            risk_type: Type of risk (stockout, overstock, normal)

        Returns:
            Human-readable explanation
        """
        if risk_type == "Stockout Risk":
            shortage_amount = reorder_point - current_stock
            return (
                f"Stockout risk detected for product {product_id} due to forecasted demand "
                f"exceeding current stock by {shortage_amount} units. "
                f"With only {current_stock} units in stock and a reorder point of {reorder_point}, "
                f"the system predicts a shortage before the next reorder cycle."
            )
        elif risk_type == "Overstock Risk":
            excess_amount = current_stock - reorder_point
            return (
                f"Overstock risk detected for product {product_id} due to excess inventory. "
                f"Current stock of {current_stock} units significantly exceeds the typical "
                f"reorder point of {reorder_point} units, leading to increased holding costs "
                f"and potential obsolescence."
            )
        else:
            return (
                f"Product {product_id} inventory level is within normal parameters. "
                f"Current stock of {current_stock} units is appropriate for expected demand patterns."
            )

    @staticmethod
    def generate_supplier_explanation(
        supplier_id: str,
        avg_lead_time: int,
        reliability_score: float,
        delay_probability: float
    ) -> str:
        """
        Generate explanation for supplier-related insights

        Args:
            supplier_id: ID of the supplier
            avg_lead_time: Average lead time for the supplier
            reliability_score: Reliability score of the supplier
            delay_probability: Probability of delay

        Returns:
            Human-readable explanation
        """
        if delay_probability > 0.7:
            return (
                f"High delay risk detected for supplier {supplier_id} with a "
                f"{delay_probability * 100:.1f}% probability of delivery delay. "
                f"The supplier's current reliability score of {reliability_score:.2f} "
                f"and increasing lead time variance indicate potential performance issues."
            )
        elif delay_probability > 0.4:
            return (
                f"Moderate delay risk detected for supplier {supplier_id} with a "
                f"{delay_probability * 100:.1f}% probability of delivery delay. "
                f"Monitor the supplier's performance closely, as their reliability "
                f"score of {reliability_score:.2f} shows some concerns."
            )
        else:
            return (
                f"Supplier {supplier_id} is performing well with a low delay probability "
                f"of {delay_probability * 100:.1f}%. Their reliability score of "
                f"{reliability_score:.2f} and consistent lead time of approximately "
                f"{avg_lead_time} days indicate reliable performance."
            )

    @staticmethod
    def generate_cost_explanation(
        record_id: str,
        anomaly_score: float,
        shipping_cost: float,
        baseline_cost: float
    ) -> str:
        """
        Generate explanation for cost-related insights

        Args:
            record_id: ID of the cost record
            anomaly_score: Anomaly score from the model
            shipping_cost: Current shipping cost
            baseline_cost: Baseline cost for comparison

        Returns:
            Human-readable explanation
        """
        if anomaly_score < -0.5:
            cost_increase = shipping_cost - baseline_cost
            return (
                f"Significant cost anomaly detected for record {record_id} with an "
                f"anomaly score of {anomaly_score:.3f}. The current cost of ${shipping_cost:.2f} "
                f"is significantly higher than the baseline of ${baseline_cost:.2f}, "
                f"representing an increase of ${cost_increase:.2f}. This may indicate "
                f"a cost leak or inefficient process that requires investigation."
            )
        elif anomaly_score < -0.2:
            return (
                f"Moderate cost anomaly detected for record {record_id} with an "
                f"anomaly score of {anomaly_score:.3f}. The current cost pattern differs "
                f"from expected values and should be reviewed for potential optimization opportunities."
            )
        else:
            return (
                f"Cost for record {record_id} is within normal parameters with an "
                f"anomaly score of {anomaly_score:.3f}, indicating expected spending patterns."
            )

    @staticmethod
    def generate_demand_explanation(
        product_id: str,
        predicted_demand: float,
        historical_avg: float,
        seasonal_factor: float
    ) -> str:
        """
        Generate explanation for demand-related insights

        Args:
            product_id: ID of the product
            predicted_demand: Predicted demand value
            historical_avg: Historical average demand
            seasonal_factor: Seasonal factor affecting demand

        Returns:
            Human-readable explanation
        """
        if predicted_demand > historical_avg * 1.3:
            demand_increase = ((predicted_demand - historical_avg) / historical_avg) * 100
            return (
                f"High demand forecast for product {product_id} with predicted demand "
                f"of {predicted_demand:.1f} units, representing a {demand_increase:.1f}% "
                f"increase over the historical average of {historical_avg:.1f} units. "
                f"This surge may be influenced by seasonal factors with a factor of "
                f"{seasonal_factor:.2f}. Ensure adequate inventory and capacity to meet demand."
            )
        elif predicted_demand > historical_avg * 1.1:
            demand_increase = ((predicted_demand - historical_avg) / historical_avg) * 100
            return (
                f"Moderate increase in demand forecast for product {product_id} with "
                f"predicted demand of {predicted_demand:.1f} units, up {demand_increase:.1f}% "
                f"from the historical average of {historical_avg:.1f} units. "
                f"Consider adjusting procurement schedules accordingly."
            )
        else:
            return (
                f"Demand for product {product_id} is expected to remain stable with "
                f"predicted demand of {predicted_demand:.1f} units, close to the "
                f"historical average of {historical_avg:.1f} units."
            )

    @staticmethod
    def generate_explanation(insight_data: Dict[str, Any]) -> str:
        """
        Generate explanation based on insight type and data

        Args:
            insight_data: Dictionary containing insight information

        Returns:
            Human-readable explanation
        """
        category = insight_data.get('category', '').lower()
        prediction_type = insight_data.get('prediction_type', '').lower()
        prediction_value = insight_data.get('prediction_value', 0)
        entity_id = insight_data.get('entity_id', 'unknown')

        # Extract additional context from insight data
        context = insight_data.get('context', {})

        if category == 'inventory':
            if prediction_type == 'stockout_risk':
                return ExplanationGenerator.generate_inventory_explanation(
                    entity_id,
                    context.get('current_stock', 0),
                    context.get('reorder_point', 0),
                    context.get('predicted_demand', 0),
                    "Stockout Risk"
                )
            elif prediction_type == 'overstock_risk':
                return ExplanationGenerator.generate_inventory_explanation(
                    entity_id,
                    context.get('current_stock', 0),
                    context.get('reorder_point', 0),
                    context.get('predicted_demand', 0),
                    "Overstock Risk"
                )
            else:
                return ExplanationGenerator.generate_inventory_explanation(
                    entity_id,
                    context.get('current_stock', 0),
                    context.get('reorder_point', 0),
                    context.get('predicted_demand', 0),
                    "Normal"
                )

        elif category == 'supplier':
            return ExplanationGenerator.generate_supplier_explanation(
                entity_id,
                context.get('avg_lead_time', 0),
                context.get('reliability_score', 0.0),
                abs(prediction_value)  # Use absolute value for probability
            )

        elif category == 'cost':
            return ExplanationGenerator.generate_cost_explanation(
                entity_id,
                prediction_value,
                context.get('current_cost', 0.0),
                context.get('baseline_cost', 0.0)
            )

        elif category == 'demand':
            return ExplanationGenerator.generate_demand_explanation(
                entity_id,
                prediction_value,
                context.get('historical_avg', 0.0),
                context.get('seasonal_factor', 1.0)
            )

        # Generic explanation if category not recognized
        return (
            f"An insight has been generated for {category} entity {entity_id} based on "
            f"ML predictions. The prediction value of {prediction_value} triggered this alert."
        )


class RecommendationGenerator:
    """
    Generates prescriptive recommendations for ML insights
    """

    @staticmethod
    def generate_inventory_recommendation(
        risk_type: str,
        product_id: str,
        current_stock: int,
        reorder_point: int,
        suggested_reorder_qty: int
    ) -> Dict[str, str]:
        """
        Generate recommendation for inventory-related insights

        Args:
            risk_type: Type of risk (stockout, overstock, normal)
            product_id: ID of the product
            current_stock: Current stock level
            reorder_point: Reorder point for the product
            suggested_reorder_qty: Suggested reorder quantity

        Returns:
            Dictionary with recommendation details
        """
        if risk_type == "Stockout Risk":
            return {
                "action": f"Reorder {suggested_reorder_qty} units of product {product_id}",
                "impact": f"Prevents potential stockout and maintains service level",
                "timeline": "Within 2-3 days"
            }
        elif risk_type == "Overstock Risk":
            return {
                "action": f"Reduce procurement of product {product_id} for next 2 weeks",
                "impact": "Reduces holding costs and prevents inventory obsolescence",
                "timeline": "Immediately"
            }
        else:
            return {
                "action": f"Maintain current ordering pattern for product {product_id}",
                "impact": "Continues optimal inventory management",
                "timeline": "Ongoing"
            }

    @staticmethod
    def generate_supplier_recommendation(
        supplier_id: str,
        delay_probability: float,
        performance_trend: str
    ) -> Dict[str, str]:
        """
        Generate recommendation for supplier-related insights

        Args:
            supplier_id: ID of the supplier
            delay_probability: Probability of delay
            performance_trend: Performance trend (improving, declining, stable)

        Returns:
            Dictionary with recommendation details
        """
        if delay_probability > 0.7:
            return {
                "action": f"Consider alternative suppliers for immediate shipments to supplier {supplier_id}",
                "impact": "Avoids potential delivery delays and supply disruptions",
                "timeline": "For next order cycle"
            }
        elif delay_probability > 0.4:
            return {
                "action": f"Increase safety stock and monitor supplier {supplier_id} performance",
                "impact": "Mitigates risk of potential delays",
                "timeline": "Ongoing monitoring"
            }
        else:
            return {
                "action": f"Continue current partnership with supplier {supplier_id}",
                "impact": "Maintains reliable supply chain",
                "timeline": "Ongoing"
            }

    @staticmethod
    def generate_cost_recommendation(
        anomaly_score: float,
        cost_center: str,
        transaction_details: str
    ) -> Dict[str, str]:
        """
        Generate recommendation for cost-related insights

        Args:
            anomaly_score: Anomaly score from the model
            cost_center: Cost center where anomaly occurred
            transaction_details: Details about the transaction

        Returns:
            Dictionary with recommendation details
        """
        if anomaly_score < -0.5:
            return {
                "action": f"Audit and investigate cost center {cost_center} for unusual expenses",
                "impact": "Identifies cost savings opportunities and prevents further waste",
                "timeline": "Within 48 hours"
            }
        elif anomaly_score < -0.2:
            return {
                "action": f"Review recent transactions in cost center {cost_center} for optimization",
                "impact": "Optimizes spending and improves cost efficiency",
                "timeline": "This week"
            }
        else:
            return {
                "action": f"No action required for cost center {cost_center}",
                "impact": "Maintains current cost management practices",
                "timeline": "Ongoing"
            }

    @staticmethod
    def generate_demand_recommendation(
        predicted_demand: float,
        product_id: str,
        current_inventory: int
    ) -> Dict[str, str]:
        """
        Generate recommendation for demand-related insights

        Args:
            predicted_demand: Predicted demand value
            product_id: ID of the product
            current_inventory: Current inventory level

        Returns:
            Dictionary with recommendation details
        """
        if predicted_demand > current_inventory * 1.5:
            suggested_procurement = int(predicted_demand * 1.2)  # 120% of predicted demand
            return {
                "action": f"Increase inventory for product {product_id} to {suggested_procurement} units",
                "impact": "Ensures adequate stock to meet high demand and prevent lost sales",
                "timeline": "Within 1 week"
            }
        elif predicted_demand > current_inventory * 1.1:
            suggested_procurement = int(predicted_demand * 1.1)  # 110% of predicted demand
            return {
                "action": f"Slightly increase inventory for product {product_id} to {suggested_procurement} units",
                "impact": "Adjusts inventory to meet anticipated demand",
                "timeline": "Next procurement cycle"
            }
        else:
            return {
                "action": f"Maintain current inventory levels for product {product_id}",
                "impact": "Continues optimal inventory management",
                "timeline": "Ongoing"
            }

    @staticmethod
    def generate_recommendation(insight_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate recommendation based on insight type and data

        Args:
            insight_data: Dictionary containing insight information

        Returns:
            Dictionary with recommendation details (action, impact, timeline)
        """
        category = insight_data.get('category', '').lower()
        prediction_type = insight_data.get('prediction_type', '').lower()
        prediction_value = insight_data.get('prediction_value', 0)
        entity_id = insight_data.get('entity_id', 'unknown')

        # Extract additional context from insight data
        context = insight_data.get('context', {})

        if category == 'inventory':
            if prediction_type == 'stockout_risk':
                return RecommendationGenerator.generate_inventory_recommendation(
                    "Stockout Risk",
                    entity_id,
                    context.get('current_stock', 0),
                    context.get('reorder_point', 0),
                    context.get('suggested_reorder_qty', 0)
                )
            elif prediction_type == 'overstock_risk':
                return RecommendationGenerator.generate_inventory_recommendation(
                    "Overstock Risk",
                    entity_id,
                    context.get('current_stock', 0),
                    context.get('reorder_point', 0),
                    context.get('suggested_reorder_qty', 0)
                )
            else:
                return RecommendationGenerator.generate_inventory_recommendation(
                    "Normal",
                    entity_id,
                    context.get('current_stock', 0),
                    context.get('reorder_point', 0),
                    context.get('suggested_reorder_qty', 0)
                )

        elif category == 'supplier':
            return RecommendationGenerator.generate_supplier_recommendation(
                entity_id,
                abs(prediction_value),  # Use absolute value for probability
                context.get('performance_trend', 'stable')
            )

        elif category == 'cost':
            return RecommendationGenerator.generate_cost_recommendation(
                prediction_value,
                context.get('cost_center', 'general'),
                context.get('transaction_details', 'not specified')
            )

        elif category == 'demand':
            return RecommendationGenerator.generate_demand_recommendation(
                prediction_value,
                entity_id,
                context.get('current_inventory', 0)
            )

        # Generic recommendation if category not recognized
        return {
            "action": f"Review and monitor {category} metric for entity {entity_id}",
            "impact": "Maintains awareness of operational changes",
            "timeline": "As needed"
        }


def get_explanation_and_recommendation(insight_data: Dict[str, Any]) -> tuple[str, Dict[str, str]]:
    """
    Generate both explanation and recommendation for an insight

    Args:
        insight_data: Dictionary containing insight information

    Returns:
        Tuple of (explanation, recommendation_dict)
    """
    explanation = ExplanationGenerator.generate_explanation(insight_data)
    recommendation = RecommendationGenerator.generate_recommendation(insight_data)
    return explanation, recommendation