import json
import time
from typing import Optional
import httpx
from ...core.config import AI_BASE_URL, AI_API_KEY, AI_REQUEST_TIMEOUT_SECONDS


class GLMClientError(Exception):
    """Raised when the GLM API returns an error."""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class GLMClient:
    """Thin wrapper around GLM's OpenAI-compatible chat API using httpx."""

    def __init__(self, base_url: str, api_key: str, timeout: int):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._client = httpx.Client(timeout=self.timeout)

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _handle_error(self, resp: httpx.Response):
        """Parse GLM error response and raise a clear exception."""
        try:
            err = resp.json().get("error", {})
            msg = err.get("message", resp.text[:200])
        except Exception:
            msg = resp.text[:200]
        if resp.status_code == 429:
            raise GLMClientError(429, f"AI service rate limited or out of credits: {msg}")
        raise GLMClientError(resp.status_code, f"AI service error: {msg}")

    def chat(self, model: str, messages: list[dict], max_tokens: int = 2048,
             stream: bool = False, response_format: Optional[dict] = None,
             retries: int = 2) -> dict:
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "stream": stream,
        }
        if response_format:
            payload["response_format"] = response_format

        for attempt in range(retries + 1):
            resp = self._client.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json=payload,
            )
            if resp.status_code == 429 and attempt < retries:
                time.sleep(2 ** attempt)
                continue
            if resp.status_code >= 400:
                self._handle_error(resp)
            return resp.json()
        self._handle_error(resp)
        return {}  # unreachable

    def chat_stream(self, model: str, messages: list[dict], max_tokens: int = 2048):
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "stream": True,
        }
        with self._client.stream(
            "POST",
            f"{self.base_url}/chat/completions",
            headers=self._headers(),
            json=payload,
        ) as resp:
            if resp.status_code >= 400:
                # Read the full response body to get the error message
                resp.read()
                self._handle_error(resp)
            for line in resp.iter_lines():
                line = line.strip()
                if not line or not line.startswith("data: "):
                    continue
                data_str = line[6:]
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
                except json.JSONDecodeError:
                    continue

    def extract_content(self, response: dict) -> str:
        """Extract content from GLM response."""
        choices = response.get("choices", [])
        if not choices:
            return ""
        message = choices[0].get("message", {})
        return message.get("content", "") or ""


def get_ai_client() -> Optional[GLMClient]:
    """Returns a configured GLM client, or None if no key."""
    if not AI_API_KEY:
        return None
    return GLMClient(
        base_url=AI_BASE_URL,
        api_key=AI_API_KEY,
        timeout=AI_REQUEST_TIMEOUT_SECONDS,
    )
