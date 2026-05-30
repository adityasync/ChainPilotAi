"""NFR-TEST-03: Unit tests for prompt loader (NFR-MAINT-02)."""

import pytest
from app.services.ai.prompts import (
    load_prompt,
    insight_generation_prompt,
    nl_query_prompt,
    supplier_narrative_prompt,
    _parse_frontmatter,
)


class TestParseFrontmatter:
    def test_parses_frontmatter(self):
        text = '---\nversion: "1.0.0"\nid: test\n---\nBody text here.'
        meta, body = _parse_frontmatter(text)
        assert meta["version"] == "1.0.0"
        assert meta["id"] == "test"
        assert body == "Body text here."

    def test_no_frontmatter(self):
        text = "Just a plain prompt."
        meta, body = _parse_frontmatter(text)
        assert meta == {}
        assert body == "Just a plain prompt."


class TestLoadPrompt:
    def test_loads_insight_generation_prompt(self):
        prompt = insight_generation_prompt()
        assert "supply chain analyst" in prompt.lower()
        assert "severity" in prompt.lower()

    def test_loads_nl_query_prompt(self):
        prompt = nl_query_prompt()
        assert "supply chain operations assistant" in prompt.lower()

    def test_loads_supplier_narrative_prompt(self):
        prompt = supplier_narrative_prompt()
        assert "risk analyst" in prompt.lower()

    def test_prompt_does_not_contain_frontmatter(self):
        """Frontmatter metadata should be stripped from the loaded prompt."""
        prompt = insight_generation_prompt()
        assert not prompt.startswith("---")
        assert "version:" not in prompt

    def test_nonexistent_prompt_raises(self):
        with pytest.raises(FileNotFoundError):
            load_prompt("nonexistent_prompt_xyz")
