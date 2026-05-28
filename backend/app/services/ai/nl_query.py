import json
from ...core.config import AI_MODEL, AI_FALLBACK_MODEL
from .client import GLMClient

NL_QUERY_SYSTEM_PROMPT = """You are a supply chain operations assistant. Answer questions using ONLY the data provided in the context below. Be specific — reference product names, stock levels, supplier names, and numbers. Keep answers concise and actionable. If the context doesn't contain enough information to answer, say so clearly."""


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
