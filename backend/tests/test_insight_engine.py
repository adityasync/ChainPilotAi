"""NFR-TEST-03: Unit tests for AI insight_engine."""

import json
import pytest
from unittest.mock import MagicMock, patch
from app.services.ai.insight_engine import generate_ai_insights
from app.models.ml_models import Insight


class TestGenerateAiInsights:
    def _mock_client(self, response_content):
        client = MagicMock()
        client.chat.return_value = {
            "choices": [{"message": {"content": response_content}}]
        }
        client.extract_content.return_value = response_content
        return client

    def test_generates_insights_from_valid_json(self, db, company):
        insights_json = json.dumps([
            {
                "title": "Low stock alert",
                "message": "Widget A is running low on stock.",
                "severity": "high",
                "entity_type": "product",
                "entity_id": 1,
            }
        ])
        client = self._mock_client(insights_json)

        result = generate_ai_insights(client, db, company_id=1, context={"inventory": []})
        assert len(result) == 1
        assert result[0]["title"] == "Low stock alert"
        assert result[0]["severity"] == "high"

    def test_handles_json_wrapped_in_object(self, db, company):
        wrapped = json.dumps({"insights": [
            {
                "title": "Test insight",
                "message": "Test message",
                "severity": "medium",
                "entity_type": "product",
                "entity_id": 1,
            }
        ]})
        client = self._mock_client(wrapped)

        result = generate_ai_insights(client, db, company_id=1, context={})
        assert len(result) == 1

    def test_handles_markdown_fenced_json(self, db, company):
        fenced = '```json\n[{"title":"T","message":"M","severity":"low","entity_type":"product","entity_id":1}]\n```'
        client = MagicMock()
        client.chat.return_value = {"choices": [{"message": {"content": fenced}}]}
        client.extract_content.return_value = fenced

        result = generate_ai_insights(client, db, company_id=1, context={})
        assert len(result) == 1

    def test_invalid_severity_defaults_to_medium(self, db, company):
        data = json.dumps([
            {
                "title": "Test",
                "message": "Msg",
                "severity": "invalid_level",
                "entity_type": "product",
                "entity_id": 1,
            }
        ])
        client = self._mock_client(data)

        result = generate_ai_insights(client, db, company_id=1, context={})
        assert result[0]["severity"] == "medium"

    def test_deletes_old_ai_insights_before_creating(self, db, company):
        old = Insight(company_id=1, title="Old", message="Old msg", severity="low", category="ai_generated", status="new")
        db.add(old)
        db.commit()

        data = json.dumps([{"title":"New","message":"New msg","severity":"high","entity_type":"product","entity_id":1}])
        client = self._mock_client(data)

        result = generate_ai_insights(client, db, company_id=1, context={})
        assert len(result) == 1
        remaining = db.query(Insight).filter(Insight.company_id == 1, Insight.category == "ai_generated").all()
        assert len(remaining) == 1
        assert remaining[0].title == "New"
