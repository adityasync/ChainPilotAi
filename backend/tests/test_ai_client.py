"""NFR-TEST-03: Unit tests for AI module — GLMClient."""

import json
import pytest
from unittest.mock import MagicMock, patch
from app.services.ai.client import GLMClient, GLMClientError, get_ai_client


class TestGLMClient:
    def _make_client(self, **kwargs):
        return GLMClient(
            base_url="https://api.test.com/v1",
            api_key="test-key",
            timeout=kwargs.get("timeout", 30),
        )

    def test_timeout_respects_configured_value(self):
        """Timeout should respect the configured value without a forced minimum."""
        client = GLMClient(base_url="https://x", api_key="k", timeout=5)
        assert client.timeout == 5

    def test_timeout_respects_higher_value(self):
        client = GLMClient(base_url="https://x", api_key="k", timeout=60)
        assert client.timeout == 60

    def test_headers_contain_bearer_token(self):
        client = self._make_client()
        headers = client._headers()
        assert headers["Authorization"] == "Bearer test-key"
        assert headers["Content-Type"] == "application/json"

    def test_extract_content_from_valid_response(self):
        client = self._make_client()
        response = {
            "choices": [{"message": {"content": "Hello world"}}]
        }
        assert client.extract_content(response) == "Hello world"

    def test_extract_content_empty_choices(self):
        client = self._make_client()
        assert client.extract_content({"choices": []}) == ""

    def test_extract_content_missing_content(self):
        client = self._make_client()
        response = {"choices": [{"message": {}}]}
        assert client.extract_content(response) == ""

    def test_handle_error_raises_glm_client_error(self):
        client = self._make_client()
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.json.return_value = {"error": {"message": "Server error"}}
        mock_resp.text = "Server error"
        with pytest.raises(GLMClientError) as exc_info:
            client._handle_error(mock_resp)
        assert exc_info.value.status_code == 500

    def test_handle_error_429_raises_rate_limit(self):
        client = self._make_client()
        mock_resp = MagicMock()
        mock_resp.status_code = 429
        mock_resp.json.return_value = {"error": {"message": "Rate limited"}}
        mock_resp.text = "Rate limited"
        with pytest.raises(GLMClientError) as exc_info:
            client._handle_error(mock_resp)
        assert exc_info.value.status_code == 429
        assert "rate limited" in exc_info.value.detail.lower()


class TestGetAIClient:
    @patch("app.services.ai.client.AI_API_KEY", "valid-key")
    def test_returns_client_when_key_set(self):
        client = get_ai_client()
        assert client is not None
        assert isinstance(client, GLMClient)

    @patch("app.services.ai.client.AI_API_KEY", "")
    def test_returns_none_when_no_key(self):
        assert get_ai_client() is None
