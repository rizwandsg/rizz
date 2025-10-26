# RIZ Travel - Budgeting Engine
# Production-ready budgeting service with integer-cent arithmetic

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Literal
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RIZ Budgeting Engine",
    description="Production-ready budgeting service with seasonality and per-person calculations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# MODELS
# ==============================================================================

class RecurringType(str, Enum):
    ONCE = "once"
    PER_DAY = "per_day"
    PER_NIGHT = "per_night"
    PER_PERSON = "per_person"
    PER_ACTIVITY = "per_activity"


class BudgetLevel(str, Enum):
    ECONOMY = "economy"
    STANDARD = "standard"
    PREMIUM = "premium"
    LUXURY = "luxury"


class CategoryType(str, Enum):
    ACCOMMODATION = "accommodation"
    FOOD = "food"
    LOCAL_TRANSPORT = "local_transport"
    INTERCITY_TRANSPORT = "intercity_transport"
    ACTIVITIES = "activities"
    MISCELLANEOUS = "miscellaneous"


class BudgetItemInput(BaseModel):
    """Input model for a single budget item"""
    category: CategoryType
    subcategory: Optional[str] = None
    title: str
    unit_cost_cents: int = Field(..., ge=0, description="Cost in cents (integer)")
    units: Decimal = Field(default=1, ge=0, description="Number of units")
    recurring_type: RecurringType = RecurringType.ONCE
    
    @validator('units')
    def validate_units(cls, v):
        if v < 0:
            raise ValueError('Units must be non-negative')
        return v


class SeasonMultiplier(BaseModel):
    """Seasonality multipliers by category"""
    accommodation: Decimal = Field(default=1.0, ge=0)
    transport: Decimal = Field(default=1.0, ge=0)
    activities: Decimal = Field(default=1.0, ge=0)
    dining: Decimal = Field(default=1.0, ge=0)
    general: Decimal = Field(default=1.0, ge=0)


class TripInput(BaseModel):
    """Input model for trip details"""
    start_date: date
    end_date: date
    travelers_count: int = Field(..., ge=1)
    location_id: Optional[str] = None
    currency: str = Field(default="USD", max_length=3)
    
    @validator('end_date')
    def validate_dates(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be >= start_date')
        return v


class BudgetPreferences(BaseModel):
    """User preferences for budget computation"""
    budget_level: BudgetLevel = BudgetLevel.STANDARD
    contingency_fraction: Decimal = Field(default=0.10, ge=0, le=1, description="10% default contingency")
    apply_seasonality: bool = True
    tax_rate: Decimal = Field(default=0.08, ge=0, le=1, description="Tax/VAT rate")
    include_fees: bool = True


class BudgetComputeRequest(BaseModel):
    """Complete budget computation request"""
    trip: TripInput
    items: List[BudgetItemInput]
    preferences: BudgetPreferences = BudgetPreferences()
    season_multiplier: Optional[SeasonMultiplier] = None


class ComputedBudgetItem(BaseModel):
    """Output model for a computed budget item"""
    category: str
    subcategory: Optional[str]
    title: str
    unit_cost_cents: int
    units: Decimal
    recurring_type: str
    computed_cost_cents: int
    per_day_cost_cents: Optional[int] = None


class BudgetBreakdown(BaseModel):
    """Category-level breakdown"""
    category: str
    total_cents: int
    percentage: Decimal
    items_count: int


class BudgetReport(BaseModel):
    """Complete budget computation result"""
    # Base calculations
    base_sum_cents: int
    days: int
    nights: int
    
    # Seasonality
    season_multiplier_applied: Decimal
    adjusted_total_cents: int
    
    # Additional costs
    contingency_cents: int
    tax_and_fees_cents: int
    
    # Final totals
    total_budget_cents: int
    per_person_cents: int
    per_day_cents: int
    
    # Breakdowns
    items: List[ComputedBudgetItem]
    breakdown_by_category: List[BudgetBreakdown]
    
    # Metadata
    currency: str
    computed_at: datetime


# ==============================================================================
# BUDGETING ENGINE CORE
# ==============================================================================

class BudgetingEngine:
    """
    Production-ready budgeting engine with:
    - Integer-cent arithmetic (no floating-point errors)
    - Seasonality multipliers
    - Per-person and per-day calculations
    - Tax and contingency handling
    """
    
    @staticmethod
    def compute_days(start_date: date, end_date: date) -> tuple[int, int]:
        """
        Compute days and nights for a trip.
        Days = inclusive (end - start + 1)
        Nights = exclusive (end - start)
        """
        delta = (end_date - start_date).days
        nights = max(0, delta)
        days = nights + 1
        return days, nights
    
    @staticmethod
    def compute_item_cost(
        item: BudgetItemInput,
        days: int,
        nights: int,
        travelers_count: int
    ) -> int:
        """
        Compute total cost for an item in cents.
        Uses integer arithmetic throughout to avoid floating-point errors.
        """
        unit_cost_cents = item.unit_cost_cents
        
        # Convert Decimal units to cents-compatible integer calculation
        # We multiply by 100 to maintain 2 decimal precision
        units_scaled = int(item.units * 100)
        
        # Base cost calculation
        base_cost = (unit_cost_cents * units_scaled) // 100
        
        # Apply recurring multiplier
        if item.recurring_type == RecurringType.PER_DAY:
            total_cost = base_cost * days
        elif item.recurring_type == RecurringType.PER_NIGHT:
            total_cost = base_cost * nights
        elif item.recurring_type == RecurringType.PER_PERSON:
            total_cost = base_cost * travelers_count
        else:  # ONCE or PER_ACTIVITY
            total_cost = base_cost
        
        return max(0, total_cost)
    
    @staticmethod
    def apply_season_multiplier(
        amount_cents: int,
        category: CategoryType,
        multiplier: SeasonMultiplier
    ) -> int:
        """
        Apply seasonality multiplier to a cost.
        Returns integer cents.
        """
        # Map categories to multiplier fields
        multiplier_map = {
            CategoryType.ACCOMMODATION: multiplier.accommodation,
            CategoryType.FOOD: multiplier.dining,
            CategoryType.LOCAL_TRANSPORT: multiplier.transport,
            CategoryType.INTERCITY_TRANSPORT: multiplier.transport,
            CategoryType.ACTIVITIES: multiplier.activities,
            CategoryType.MISCELLANEOUS: multiplier.general,
        }
        
        mult = multiplier_map.get(category, Decimal(1.0))
        
        # Convert multiplier to integer basis points (x10000 for 4 decimal precision)
        mult_scaled = int(mult * 10000)
        adjusted_cents = (amount_cents * mult_scaled) // 10000
        
        return adjusted_cents
    
    @staticmethod
    def compute_budget(request: BudgetComputeRequest) -> BudgetReport:
        """
        Main budget computation logic.
        """
        trip = request.trip
        items_input = request.items
        preferences = request.preferences
        season_mult = request.season_multiplier or SeasonMultiplier()
        
        # 1. Compute days and nights
        days, nights = BudgetingEngine.compute_days(trip.start_date, trip.end_date)
        
        logger.info(f"Computing budget for {days} days, {nights} nights, {trip.travelers_count} travelers")
        
        # 2. Compute base cost for each item
        computed_items: List[ComputedBudgetItem] = []
        base_sum_cents = 0
        
        for item in items_input:
            computed_cost = BudgetingEngine.compute_item_cost(
                item, days, nights, trip.travelers_count
            )
            
            # Compute per-day cost if applicable
            per_day_cost = None
            if days > 0:
                per_day_cost = computed_cost // days
            
            computed_item = ComputedBudgetItem(
                category=item.category.value,
                subcategory=item.subcategory,
                title=item.title,
                unit_cost_cents=item.unit_cost_cents,
                units=item.units,
                recurring_type=item.recurring_type.value,
                computed_cost_cents=computed_cost,
                per_day_cost_cents=per_day_cost
            )
            
            computed_items.append(computed_item)
            base_sum_cents += computed_cost
        
        logger.info(f"Base sum: {base_sum_cents} cents ({base_sum_cents / 100:.2f} {trip.currency})")
        
        # 3. Apply seasonality if enabled
        season_multiplier_value = Decimal(1.0)
        adjusted_total_cents = base_sum_cents
        
        if preferences.apply_seasonality:
            adjusted_total_cents = 0
            for item in computed_items:
                category_enum = CategoryType(item.category)
                adjusted_cost = BudgetingEngine.apply_season_multiplier(
                    item.computed_cost_cents,
                    category_enum,
                    season_mult
                )
                adjusted_total_cents += adjusted_cost
            
            # Compute effective multiplier
            if base_sum_cents > 0:
                season_multiplier_value = Decimal(adjusted_total_cents) / Decimal(base_sum_cents)
            
            logger.info(f"Season-adjusted total: {adjusted_total_cents} cents (multiplier: {season_multiplier_value:.4f})")
        
        # 4. Compute contingency
        contingency_cents = int(adjusted_total_cents * preferences.contingency_fraction)
        
        # 5. Compute taxes and fees
        tax_and_fees_cents = 0
        if preferences.include_fees:
            tax_and_fees_cents = int(adjusted_total_cents * preferences.tax_rate)
        
        # 6. Final total
        total_budget_cents = adjusted_total_cents + contingency_cents + tax_and_fees_cents
        
        # 7. Per-person and per-day
        per_person_cents = total_budget_cents // trip.travelers_count
        per_day_cents = total_budget_cents // days if days > 0 else 0
        
        logger.info(f"Final budget: {total_budget_cents} cents ({total_budget_cents / 100:.2f} {trip.currency})")
        logger.info(f"Per person: {per_person_cents / 100:.2f}, Per day: {per_day_cents / 100:.2f}")
        
        # 8. Category breakdown
        category_totals: Dict[str, int] = {}
        category_counts: Dict[str, int] = {}
        
        for item in computed_items:
            cat = item.category
            category_totals[cat] = category_totals.get(cat, 0) + item.computed_cost_cents
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        breakdown = []
        for cat, total in category_totals.items():
            percentage = Decimal(0)
            if base_sum_cents > 0:
                percentage = (Decimal(total) / Decimal(base_sum_cents) * 100).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
            
            breakdown.append(BudgetBreakdown(
                category=cat,
                total_cents=total,
                percentage=percentage,
                items_count=category_counts[cat]
            ))
        
        # Sort breakdown by total descending
        breakdown.sort(key=lambda x: x.total_cents, reverse=True)
        
        # 9. Build report
        report = BudgetReport(
            base_sum_cents=base_sum_cents,
            days=days,
            nights=nights,
            season_multiplier_applied=season_multiplier_value,
            adjusted_total_cents=adjusted_total_cents,
            contingency_cents=contingency_cents,
            tax_and_fees_cents=tax_and_fees_cents,
            total_budget_cents=total_budget_cents,
            per_person_cents=per_person_cents,
            per_day_cents=per_day_cents,
            items=computed_items,
            breakdown_by_category=breakdown,
            currency=trip.currency,
            computed_at=datetime.utcnow()
        )
        
        return report


# ==============================================================================
# API ENDPOINTS
# ==============================================================================

@app.get("/")
def root():
    return {
        "service": "RIZ Budgeting Engine",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health/live")
def health_live():
    """Liveness probe"""
    return {"status": "alive"}


@app.get("/health/ready")
def health_ready():
    """Readiness probe"""
    # Add checks for DB, Redis, etc. in production
    return {"status": "ready"}


@app.post("/budget/compute", response_model=BudgetReport)
def compute_budget(request: BudgetComputeRequest):
    """
    Compute budget for a trip.
    
    **Example Request:**
    ```json
    {
      "trip": {
        "start_date": "2025-07-15",
        "end_date": "2025-07-22",
        "travelers_count": 2,
        "currency": "EUR"
      },
      "items": [
        {
          "category": "accommodation",
          "title": "Hotel",
          "unit_cost_cents": 12000,
          "units": 7,
          "recurring_type": "per_night"
        }
      ],
      "preferences": {
        "budget_level": "standard",
        "contingency_fraction": 0.10,
        "apply_seasonality": true
      }
    }
    ```
    """
    try:
        report = BudgetingEngine.compute_budget(request)
        return report
    except Exception as e:
        logger.error(f"Budget computation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Budget computation failed: {str(e)}")


@app.get("/categories")
def list_categories():
    """List available budget categories"""
    return {
        "categories": [cat.value for cat in CategoryType]
    }


@app.get("/recurring-types")
def list_recurring_types():
    """List available recurring types"""
    return {
        "recurring_types": [rt.value for rt in RecurringType]
    }


@app.get("/metrics")
def metrics():
    """Prometheus metrics endpoint (stub)"""
    # In production, use prometheus_client library
    return {
        "metrics": "# Prometheus metrics would be here"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
