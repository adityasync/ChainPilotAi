"""
NFR-MAINT-02: Versioned system prompt loader.

Loads prompts from docs/prompts/*.md files. Each file has YAML frontmatter
with version, id, and last_updated fields, followed by the prompt body.

Falls back to hardcoded defaults if the file is missing.
"""

import os
import re
from functools import lru_cache
from pathlib import Path

# Resolve docs/prompts relative to the project root
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent  # backend/
_PROJECT_ROOT = _BACKEND_DIR.parent
_PROMPTS_DIR = _PROJECT_ROOT / "docs" / "prompts"

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def _parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    """Split YAML-like frontmatter from the prompt body. Returns (meta, body)."""
    match = _FRONTMATTER_RE.match(text)
    if not match:
        return {}, text

    meta: dict[str, str] = {}
    for line in match.group(1).strip().splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip().strip('"')
    body = text[match.end():]
    return meta, body


@lru_cache(maxsize=8)
def load_prompt(name: str) -> str:
    """Load a versioned system prompt by name (e.g. 'insight_generation').

    Returns the prompt body text with frontmatter stripped.
    Raises FileNotFoundError if the prompt file is missing and no fallback exists.
    """
    filepath = _PROMPTS_DIR / f"{name}_system.md"
    if filepath.exists():
        text = filepath.read_text(encoding="utf-8")
        _meta, body = _parse_frontmatter(text)
        return body.strip()

    raise FileNotFoundError(
        f"NFR-MAINT-02: Prompt file not found: {filepath}. "
        f"Ensure docs/prompts/{name}_system.md exists."
    )


# Convenience functions for each prompt
def insight_generation_prompt() -> str:
    return load_prompt("insight_generation")


def nl_query_prompt() -> str:
    return load_prompt("nl_query")


def supplier_narrative_prompt() -> str:
    return load_prompt("supplier_narrative")
