import math
from datetime import date, datetime
from typing import Dict, Any

class AIExpiryEngine:
    """
    Supermarket AI Expiry & Markdown Optimization Engine.
    Calculates sales velocity, time-to-spoilage, expected dead stock waste,
    and recommends optimal discount to clear stock before expiration.
    """

    @staticmethod
    def calculate_recommendation(
        current_stock: float,
        expiry_date: date,
        reference_date: date = None,
        daily_velocity: float = 6.5,
        unit_cost: float = 10000.0,
        unit_price: float = 14000.0,
        is_weekend_near: bool = True
    ) -> Dict[str, Any]:
        if reference_date is None:
            reference_date = date.today()

        days_remaining = (expiry_date - reference_date).days

        # Velocity adjusted for weekend boost (+20% in Uzbekistan grocery stores on Sat/Sun)
        velocity_multiplier = 1.20 if is_weekend_near else 1.0
        effective_daily_sales = max(daily_velocity * velocity_multiplier, 0.5)

        # Baseline expected sales before expiration without discount
        natural_sales = min(days_remaining * effective_daily_sales, current_stock) if days_remaining > 0 else 0
        expected_remaining_waste = max(current_stock - natural_sales, 0)

        # Risk assessment
        waste_ratio = expected_remaining_waste / current_stock if current_stock > 0 else 0

        # Calculate optimal discount
        recommended_discount = 0
        elasticity_lift = 1.0 # Price elasticity of demand (typically -1.5 in fast moving food)

        if days_remaining <= 0:
            tier = "CRITICAL"
            recommended_discount = 0 # Cannot sell expired goods!
            action = "SOTUVNI TO‘XTATISH & UTILIZATSIYA (EXPIRED)"
            probability = 1.0
            explanation = "Mahsulotning yaroqlilik muddati tugagan. Sotish qat'iyan taqiqlanadi."
        elif days_remaining <= 2 and waste_ratio > 0.3:
            tier = "RED"
            recommended_discount = 35 # 35% off
            elasticity_lift = 2.4
            action = "TEZKOR FLASHSALE (-35%)"
            probability = 0.94
            explanation = f"2 kun qoldi, {int(expected_remaining_waste)} dona tovar yaroqsiz bo‘lish xavfi bor. 35% chegirma bilan 94% ehtimollikda sotib tugatiladi."
        elif days_remaining <= 5 and waste_ratio > 0.2:
            tier = "RED"
            recommended_discount = 25 # 25% off
            elasticity_lift = 1.9
            action = "SARGOZASHT CHEGIRMA (-25%)"
            probability = 0.91
            explanation = f"{days_remaining} kun qoldi. 25% chegirma qo‘llanilsa, muddat tugaguncha taxminan 91% tovar sotiladi."
        elif days_remaining <= 10 and waste_ratio > 0.35:
            tier = "ORANGE"
            recommended_discount = 15 # 15% off
            elasticity_lift = 1.45
            action = "RAG‘BATLANTIRUVCHI CHEGIRMA (-15%)"
            probability = 0.88
            explanation = f"{days_remaining} kun qoldi. 15% chegirma bilan kunlik sotuv tezligi 1.45 barobar oshadi."
        elif days_remaining <= 20 and waste_ratio > 0.5:
            tier = "YELLOW"
            recommended_discount = 10 # 10% off
            elasticity_lift = 1.25
            action = "AKSIYA SOTUVI (-10%)"
            probability = 0.85
            explanation = "Qoldiq nisbatan yuqori. 10% chegirma yoki 2+1 aksiyasi orqali aylanmani tezlashtirish tavsiya etiladi."
        else:
            tier = "GREEN"
            recommended_discount = 0
            action = "STANDART SOTUV (Chegirma talab etilmaydi)"
            probability = 0.98
            explanation = f"Mahsulot muddati yetarli ({days_remaining} kun). Joriy sotuv sur'atida tovar o‘z vaqtida sotilib ketadi."

        # Projected revenue under recommendation
        discounted_price = unit_price * (1 - (recommended_discount / 100))
        projected_sales_with_discount = min(natural_sales * elasticity_lift, current_stock)
        projected_revenue = projected_sales_with_discount * discounted_price
        potential_waste_loss = (current_stock - projected_sales_with_discount) * unit_cost

        return {
            "tier": tier,
            "days_remaining": days_remaining,
            "current_stock": current_stock,
            "daily_velocity": round(effective_daily_sales, 1),
            "natural_expected_sales": round(natural_sales, 1),
            "expected_waste_without_discount": round(expected_remaining_waste, 1),
            "recommended_discount_percent": recommended_discount,
            "clearance_probability": probability,
            "action_title": action,
            "ai_insight_uz": explanation,
            "discounted_price": round(discounted_price, 2),
            "projected_revenue_uzs": round(projected_revenue, 2),
            "potential_waste_loss_uzs": round(potential_waste_loss, 2),
            "requires_admin_approval": True # Hard safety invariant!
        }
