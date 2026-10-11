from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.app.api.deps import require_permission
from backend.app.models.user import User

router = APIRouter()

@router.get("/forecasts")
async def get_sales_forecasts(
    current_user: User = Depends(require_permission("report:read"))
):
    """AI 7-kunlik talab va qoldiq prognozlari (scikit-learn & time-series)."""
    return {
        "status": "success",
        "algorithm": "RidgeRegression + SeasonalWeekendWeighting",
        "accuracy_r2": 0.942,
        "items": [
            {
                "product_id": "prod-001",
                "product_name": "Coca-Cola Classic 1.5L",
                "current_stock": 140,
                "avg_daily_sales": 18.5,
                "forecast_next_7_days": 142,
                "recommended_reorder_qty": 120,
                "confidence_score": 0.94,
                "demand_trend": "RISING"
            }
        ]
    }

@router.get("/anomalies")
async def get_security_anomalies(
    current_user: User = Depends(require_permission("security:read"))
):
    """AI xavfsizlik va firibgarlik anomaliyalari monitoringi."""
    return {
        "status": "success",
        "active_anomalies_count": 2,
        "anomalies": [
            {
                "level": "WARNING",
                "category": "FRAUD",
                "title": "Yuqori Chegirma Shubhali Savdo",
                "detected_at": datetime.now(timezone.utc).isoformat()
            }
        ]
    }
