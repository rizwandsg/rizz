"""
Unit tests for RIZ Budgeting Engine
Tests integer-cent arithmetic, seasonality, and edge cases
"""

import pytest
from datetime import date
from decimal import Decimal
from main import (
    BudgetingEngine,
    BudgetComputeRequest,
    TripInput,
    BudgetItemInput,
    BudgetPreferences,
    SeasonMultiplier,
    RecurringType,
    CategoryType,
    BudgetLevel
)


class TestDaysComputation:
    """Test days and nights calculation"""
    
    def test_same_day_trip(self):
        days, nights = BudgetingEngine.compute_days(
            date(2025, 7, 15),
            date(2025, 7, 15)
        )
        assert days == 1
        assert nights == 0
    
    def test_one_night_trip(self):
        days, nights = BudgetingEngine.compute_days(
            date(2025, 7, 15),
            date(2025, 7, 16)
        )
        assert days == 2
        assert nights == 1
    
    def test_week_long_trip(self):
        days, nights = BudgetingEngine.compute_days(
            date(2025, 7, 15),
            date(2025, 7, 22)
        )
        assert days == 8
        assert nights == 7


class TestItemCostComputation:
    """Test individual item cost calculation"""
    
    def test_once_item(self):
        item = BudgetItemInput(
            category=CategoryType.MISCELLANEOUS,
            title="Airport transfer",
            unit_cost_cents=5000,
            units=Decimal("1"),
            recurring_type=RecurringType.ONCE
        )
        cost = BudgetingEngine.compute_item_cost(item, days=7, nights=6, travelers_count=2)
        assert cost == 5000
    
    def test_per_day_item(self):
        item = BudgetItemInput(
            category=CategoryType.FOOD,
            title="Daily meals",
            unit_cost_cents=5000,
            units=Decimal("1"),
            recurring_type=RecurringType.PER_DAY
        )
        cost = BudgetingEngine.compute_item_cost(item, days=7, nights=6, travelers_count=2)
        assert cost == 35000  # 5000 * 7 days
    
    def test_per_night_item(self):
        item = BudgetItemInput(
            category=CategoryType.ACCOMMODATION,
            title="Hotel",
            unit_cost_cents=12000,
            units=Decimal("1"),
            recurring_type=RecurringType.PER_NIGHT
        )
        cost = BudgetingEngine.compute_item_cost(item, days=7, nights=6, travelers_count=2)
        assert cost == 72000  # 12000 * 6 nights
    
    def test_per_person_item(self):
        item = BudgetItemInput(
            category=CategoryType.INTERCITY_TRANSPORT,
            title="Flight",
            unit_cost_cents=50000,
            units=Decimal("1"),
            recurring_type=RecurringType.PER_PERSON
        )
        cost = BudgetingEngine.compute_item_cost(item, days=7, nights=6, travelers_count=3)
        assert cost == 150000  # 50000 * 3 travelers
    
    def test_decimal_units(self):
        """Test that decimal units work correctly"""
        item = BudgetItemInput(
            category=CategoryType.ACTIVITIES,
            title="Tour",
            unit_cost_cents=10000,
            units=Decimal("2.5"),  # 2.5 units
            recurring_type=RecurringType.ONCE
        )
        cost = BudgetingEngine.compute_item_cost(item, days=1, nights=0, travelers_count=1)
        assert cost == 25000  # 10000 * 2.5
    
    def test_fractional_cents_rounding(self):
        """Test that fractional cents are handled correctly"""
        item = BudgetItemInput(
            category=CategoryType.ACTIVITIES,
            title="Tour",
            unit_cost_cents=3333,  # Odd number
            units=Decimal("1.5"),
            recurring_type=RecurringType.ONCE
        )
        cost = BudgetingEngine.compute_item_cost(item, days=1, nights=0, travelers_count=1)
        # 3333 * 1.5 = 4999.5 → should round down to 4999
        assert cost == 4999


class TestSeasonalityMultiplier:
    """Test seasonality multiplier application"""
    
    def test_peak_season_accommodation(self):
        multiplier = SeasonMultiplier(
            accommodation=Decimal("1.5"),
            transport=Decimal("1.2"),
            activities=Decimal("1.1"),
            dining=Decimal("1.0")
        )
        
        adjusted = BudgetingEngine.apply_season_multiplier(
            10000,
            CategoryType.ACCOMMODATION,
            multiplier
        )
        assert adjusted == 15000
    
    def test_off_season_discount(self):
        multiplier = SeasonMultiplier(
            accommodation=Decimal("0.7")
        )
        
        adjusted = BudgetingEngine.apply_season_multiplier(
            10000,
            CategoryType.ACCOMMODATION,
            multiplier
        )
        assert adjusted == 7000
    
    def test_no_multiplier(self):
        multiplier = SeasonMultiplier()  # All defaults to 1.0
        
        adjusted = BudgetingEngine.apply_season_multiplier(
            10000,
            CategoryType.FOOD,
            multiplier
        )
        assert adjusted == 10000


class TestFullBudgetComputation:
    """Test end-to-end budget computation"""
    
    def test_simple_trip_no_seasonality(self):
        """Test basic trip without seasonality"""
        request = BudgetComputeRequest(
            trip=TripInput(
                start_date=date(2025, 7, 15),
                end_date=date(2025, 7, 22),
                travelers_count=2,
                currency="EUR"
            ),
            items=[
                BudgetItemInput(
                    category=CategoryType.ACCOMMODATION,
                    title="Hotel",
                    unit_cost_cents=12000,
                    units=Decimal("1"),
                    recurring_type=RecurringType.PER_NIGHT
                ),
                BudgetItemInput(
                    category=CategoryType.FOOD,
                    title="Meals",
                    unit_cost_cents=5000,
                    units=Decimal("1"),
                    recurring_type=RecurringType.PER_DAY
                )
            ],
            preferences=BudgetPreferences(
                budget_level=BudgetLevel.STANDARD,
                contingency_fraction=Decimal("0.10"),
                apply_seasonality=False,
                tax_rate=Decimal("0.08"),
                include_fees=True
            )
        )
        
        report = BudgetingEngine.compute_budget(request)
        
        # Days: 8, Nights: 7
        # Hotel: 12000 * 7 = 84000
        # Meals: 5000 * 8 = 40000
        # Base: 124000
        assert report.base_sum_cents == 124000
        assert report.days == 8
        assert report.nights == 7
        
        # No seasonality
        assert report.adjusted_total_cents == 124000
        
        # Contingency: 124000 * 0.10 = 12400
        assert report.contingency_cents == 12400
        
        # Tax: 124000 * 0.08 = 9920
        assert report.tax_and_fees_cents == 9920
        
        # Total: 124000 + 12400 + 9920 = 146320
        assert report.total_budget_cents == 146320
        
        # Per person: 146320 / 2 = 73160
        assert report.per_person_cents == 73160
        
        # Per day: 146320 / 8 = 18290
        assert report.per_day_cents == 18290
    
    def test_trip_with_seasonality(self):
        """Test trip with peak season multipliers"""
        request = BudgetComputeRequest(
            trip=TripInput(
                start_date=date(2025, 7, 15),
                end_date=date(2025, 7, 22),
                travelers_count=2,
                currency="EUR"
            ),
            items=[
                BudgetItemInput(
                    category=CategoryType.ACCOMMODATION,
                    title="Hotel",
                    unit_cost_cents=10000,
                    units=Decimal("1"),
                    recurring_type=RecurringType.PER_NIGHT
                )
            ],
            preferences=BudgetPreferences(
                contingency_fraction=Decimal("0"),
                apply_seasonality=True,
                tax_rate=Decimal("0"),
                include_fees=False
            ),
            season_multiplier=SeasonMultiplier(
                accommodation=Decimal("1.5")
            )
        )
        
        report = BudgetingEngine.compute_budget(request)
        
        # Base: 10000 * 7 nights = 70000
        assert report.base_sum_cents == 70000
        
        # Season adjusted: 70000 * 1.5 = 105000
        assert report.adjusted_total_cents == 105000
        assert report.season_multiplier_applied == Decimal("1.5")
        
        # No contingency or tax
        assert report.total_budget_cents == 105000
    
    def test_multi_category_budget(self):
        """Test budget with multiple categories"""
        request = BudgetComputeRequest(
            trip=TripInput(
                start_date=date(2025, 11, 1),
                end_date=date(2025, 11, 10),
                travelers_count=1,
                currency="USD"
            ),
            items=[
                BudgetItemInput(
                    category=CategoryType.ACCOMMODATION,
                    title="Hotel",
                    unit_cost_cents=15000,
                    units=Decimal("1"),
                    recurring_type=RecurringType.PER_NIGHT
                ),
                BudgetItemInput(
                    category=CategoryType.FOOD,
                    title="Meals",
                    unit_cost_cents=8000,
                    units=Decimal("1"),
                    recurring_type=RecurringType.PER_DAY
                ),
                BudgetItemInput(
                    category=CategoryType.INTERCITY_TRANSPORT,
                    title="Flight",
                    unit_cost_cents=50000,
                    units=Decimal("1"),
                    recurring_type=RecurringType.ONCE
                ),
                BudgetItemInput(
                    category=CategoryType.ACTIVITIES,
                    title="Tours",
                    unit_cost_cents=10000,
                    units=Decimal("3"),
                    recurring_type=RecurringType.ONCE
                )
            ],
            preferences=BudgetPreferences(
                contingency_fraction=Decimal("0.15"),
                apply_seasonality=False,
                tax_rate=Decimal("0"),
                include_fees=False
            )
        )
        
        report = BudgetingEngine.compute_budget(request)
        
        # Days: 10, Nights: 9
        # Hotel: 15000 * 9 = 135000
        # Meals: 8000 * 10 = 80000
        # Flight: 50000 * 1 = 50000
        # Tours: 10000 * 3 = 30000
        # Base: 295000
        assert report.base_sum_cents == 295000
        
        # Contingency: 295000 * 0.15 = 44250
        assert report.contingency_cents == 44250
        
        # Total: 295000 + 44250 = 339250
        assert report.total_budget_cents == 339250
        
        # Check breakdown
        assert len(report.breakdown_by_category) == 4
        
        # Accommodation should be largest
        accom_breakdown = next(b for b in report.breakdown_by_category if b.category == "accommodation")
        assert accom_breakdown.total_cents == 135000
        assert accom_breakdown.items_count == 1
    
    def test_zero_cost_item(self):
        """Test that zero-cost items are handled"""
        request = BudgetComputeRequest(
            trip=TripInput(
                start_date=date(2025, 1, 1),
                end_date=date(2025, 1, 2),
                travelers_count=1,
                currency="USD"
            ),
            items=[
                BudgetItemInput(
                    category=CategoryType.ACTIVITIES,
                    title="Free museum",
                    unit_cost_cents=0,
                    units=Decimal("1"),
                    recurring_type=RecurringType.ONCE
                )
            ],
            preferences=BudgetPreferences(
                contingency_fraction=Decimal("0"),
                apply_seasonality=False,
                tax_rate=Decimal("0"),
                include_fees=False
            )
        )
        
        report = BudgetingEngine.compute_budget(request)
        assert report.base_sum_cents == 0
        assert report.total_budget_cents == 0


class TestEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_single_traveler(self):
        """Test computation with single traveler"""
        request = BudgetComputeRequest(
            trip=TripInput(
                start_date=date(2025, 1, 1),
                end_date=date(2025, 1, 1),
                travelers_count=1,
                currency="USD"
            ),
            items=[
                BudgetItemInput(
                    category=CategoryType.FOOD,
                    title="Meal",
                    unit_cost_cents=2000,
                    units=Decimal("1"),
                    recurring_type=RecurringType.ONCE
                )
            ],
            preferences=BudgetPreferences(
                contingency_fraction=Decimal("0"),
                apply_seasonality=False,
                tax_rate=Decimal("0"),
                include_fees=False
            )
        )
        
        report = BudgetingEngine.compute_budget(request)
        assert report.per_person_cents == 2000
    
    def test_large_group(self):
        """Test computation with large group"""
        request = BudgetComputeRequest(
            trip=TripInput(
                start_date=date(2025, 1, 1),
                end_date=date(2025, 1, 2),
                travelers_count=50,
                currency="USD"
            ),
            items=[
                BudgetItemInput(
                    category=CategoryType.ACTIVITIES,
                    title="Group tour",
                    unit_cost_cents=1000,
                    units=Decimal("1"),
                    recurring_type=RecurringType.PER_PERSON
                )
            ],
            preferences=BudgetPreferences(
                contingency_fraction=Decimal("0"),
                apply_seasonality=False,
                tax_rate=Decimal("0"),
                include_fees=False
            )
        )
        
        report = BudgetingEngine.compute_budget(request)
        # 1000 * 50 = 50000
        assert report.base_sum_cents == 50000
        assert report.per_person_cents == 1000  # 50000 / 50
    
    def test_no_items(self):
        """Test budget with no items"""
        request = BudgetComputeRequest(
            trip=TripInput(
                start_date=date(2025, 1, 1),
                end_date=date(2025, 1, 2),
                travelers_count=1,
                currency="USD"
            ),
            items=[],
            preferences=BudgetPreferences()
        )
        
        report = BudgetingEngine.compute_budget(request)
        assert report.base_sum_cents == 0
        assert report.total_budget_cents == 0
        assert len(report.breakdown_by_category) == 0


class TestIntegerArithmetic:
    """Test that all arithmetic uses integers (no floating-point errors)"""
    
    def test_no_floating_point_errors(self):
        """Ensure 0.1 + 0.2 style errors don't occur"""
        # Use values that would cause floating-point issues
        request = BudgetComputeRequest(
            trip=TripInput(
                start_date=date(2025, 1, 1),
                end_date=date(2025, 1, 1),
                travelers_count=3,
                currency="USD"
            ),
            items=[
                BudgetItemInput(
                    category=CategoryType.FOOD,
                    title="Item",
                    unit_cost_cents=1,
                    units=Decimal("1"),
                    recurring_type=RecurringType.PER_PERSON
                )
            ],
            preferences=BudgetPreferences(
                contingency_fraction=Decimal("0.1"),
                apply_seasonality=False,
                tax_rate=Decimal("0.2"),
                include_fees=True
            )
        )
        
        report = BudgetingEngine.compute_budget(request)
        
        # All values should be exact integers
        assert isinstance(report.base_sum_cents, int)
        assert isinstance(report.adjusted_total_cents, int)
        assert isinstance(report.contingency_cents, int)
        assert isinstance(report.tax_and_fees_cents, int)
        assert isinstance(report.total_budget_cents, int)
        assert isinstance(report.per_person_cents, int)
    
    def test_division_rounding(self):
        """Test that division rounds down (floor division)"""
        request = BudgetComputeRequest(
            trip=TripInput(
                start_date=date(2025, 1, 1),
                end_date=date(2025, 1, 1),
                travelers_count=3,
                currency="USD"
            ),
            items=[
                BudgetItemInput(
                    category=CategoryType.FOOD,
                    title="Item",
                    unit_cost_cents=10,
                    units=Decimal("1"),
                    recurring_type=RecurringType.ONCE
                )
            ],
            preferences=BudgetPreferences(
                contingency_fraction=Decimal("0"),
                apply_seasonality=False,
                tax_rate=Decimal("0"),
                include_fees=False
            )
        )
        
        report = BudgetingEngine.compute_budget(request)
        
        # 10 / 3 = 3.333... should floor to 3
        assert report.per_person_cents == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
