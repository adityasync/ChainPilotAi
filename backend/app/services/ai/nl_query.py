import json
from ...core.config import AI_MODEL, AI_FALLBACK_MODEL
from .client import GLMClient
from .prompts import nl_query_prompt

NL_QUERY_SYSTEM_PROMPT = nl_query_prompt()


def stream_nl_query(client: GLMClient, context: dict, question: str):
    context_str = json.dumps(context, default=str)
    messages = [
        {"role": "system", "content": f"{NL_QUERY_SYSTEM_PROMPT}\n\nContext:\n{context_str}"},
        {"role": "user", "content": question},
    ]
    try:
        yield from client.chat_stream(AI_MODEL or "glm-4.5-flash", messages)
    except Exception:
        if AI_FALLBACK_MODEL:
            try:
                yield from client.chat_stream(AI_FALLBACK_MODEL, messages)
            except Exception as e2:
                yield f"Error communicating with AI service: {str(e2)}"
        else:
            yield "Error communicating with AI service."
