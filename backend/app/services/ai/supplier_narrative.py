import json
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ...models.ml_models import Prediction
from ...core.config import AI_MODEL
from .client import GLMClient
from .prompts import supplier_narrative_prompt

NARRATIVE_SYSTEM_PROMPT = supplier_narrative_prompt()


async def get_or_generate_narrative(client: GLMClient, db: AsyncSession, supplier_id: int, company_id: int, context: dict) -> dict:
    # Check cache
    result = await db.execute(
        select(Prediction).filter(
            Prediction.company_id == company_id,
            Prediction.entity_type == "supplier",
            Prediction.entity_id == supplier_id,
            Prediction.prediction_type == "ai_narrative",
        ).order_by(Prediction.created_at.desc())
    )
    cached = result.scalars().first()

    if cached and cached.created_at:
        now = datetime.now(timezone.utc)
        created_at = cached.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if now - created_at < timedelta(hours=24):
            return {"narrative": cached.prediction_text, "cached": True}

    context_str = json.dumps(context, default=str)

    try:
        response = client.chat(
            model=AI_MODEL or "glm-4.5-flash",
            messages=[
                {"role": "system", "content": NARRATIVE_SYSTEM_PROMPT},
                {"role": "user", "content": f"Supplier data:\n{context_str}"},
            ],
        )
        response_text = client.extract_content(response)

        # Save to cache
        prediction = Prediction(
            company_id=company_id,
            entity_type="supplier",
            entity_id=supplier_id,
            prediction_type="ai_narrative",
            prediction_value=None,
            prediction_text=response_text,
        )
        db.add(prediction)
        await db.commit()

        return {"narrative": response_text, "cached": False}
    except Exception as e:
        if cached:
            return {"narrative": cached.prediction_text, "cached": True}
        raise e
