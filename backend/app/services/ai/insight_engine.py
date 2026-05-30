import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.exceptions import ServiceUnavailableError, AppError
from ...models.ml_models import Insight
from ...core.config import AI_MODEL
from .client import GLMClient
from .prompts import insight_generation_prompt

INSIGHT_SYSTEM_PROMPT = insight_generation_prompt()


async def generate_ai_insights(client: GLMClient, db: AsyncSession, company_id: int, context: dict) -> list[dict]:
    context_str = json.dumps(context, default=str)

    try:
        response = client.chat(
            model=AI_MODEL or "glm-4.5-flash",
            messages=[
                {"role": "system", "content": INSIGHT_SYSTEM_PROMPT},
                {"role": "user", "content": f"Here is the context data:\n{context_str}"},
            ],
            response_format={"type": "json_object"},
        )
        content = client.extract_content(response)
        if not content:
            raise ValueError("Empty response from AI")

        # Strip markdown fences if present
        if content.strip().startswith("```json"):
            content = content.strip()[7:-3].strip()
        elif content.strip().startswith("```"):
            content = content.strip()[3:-3].strip()

        insights_data = json.loads(content)
        if isinstance(insights_data, dict) and "insights" in insights_data:
            insights_data = insights_data["insights"]
        elif not isinstance(insights_data, list):
            raise ValueError("Expected a JSON array of insights")

    except Exception as e:
        raise AppError(code="AI_PARSE_ERROR", message=f"Failed to generate or parse insights: {str(e)}", status_code=502)

    # Delete existing AI-generated insights for this company
    result = await db.execute(
        select(Insight).filter(Insight.company_id == company_id, Insight.category == "ai_generated")
    )
    for insight in result.scalars().all():
        await db.delete(insight)

    created_insights = []
    for item in insights_data:
        severity = item.get("severity", "medium").lower()
        if severity not in ["low", "medium", "high"]:
            continue  # Skip insights with invalid severity

        insight = Insight(
            company_id=company_id,
            title=item.get("title", "Insight"),
            message=item.get("message", ""),
            severity=severity,
            entity_type=item.get("entity_type"),
            entity_id=item.get("entity_id"),
            category="ai_generated",
            status="new",
        )
        db.add(insight)
        created_insights.append(insight)

    await db.commit()

    return [
        {
            "id": i.id,
            "title": i.title,
            "message": i.message,
            "severity": i.severity,
            "entity_type": i.entity_type,
            "entity_id": i.entity_id,
            "category": i.category,
        }
        for i in created_insights
    ]
