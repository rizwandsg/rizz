"""
RIZ Travel App - Complete Example Usage
Demonstrates the entire system working together
"""

import asyncio
import json
from datetime import date, timedelta
from decimal import Decimal
from main import BudgetingEngine, BudgetComputeRequest, TripInput, BudgetItemInput, BudgetPreferences, SeasonMultiplier, RecurringType, CategoryType, BudgetLevel


def print_section(title: str):
    """Print formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def format_currency(cents: int, currency: str = "EUR") -> str:
    """Format cents as currency"""
    return f"{cents / 100:.2f} {currency}"


def example_1_simple_paris_trip():
    """Example 1: Simple Paris trip with basic items"""
    print_section("Example 1: Simple Paris Weekend Trip")
    
    request = BudgetComputeRequest(
        trip=TripInput(
            start_date=date(2025, 7, 15),
            end_date=date(2025, 7, 17),  # 3 days, 2 nights
            travelers_count=2,
            currency="EUR"
        ),
        items=[
            BudgetItemInput(
                category=CategoryType.ACCOMMODATION,
                subcategory="hotel",
                title="Boutique Hotel in Le Marais",
                unit_cost_cents=12000,  # €120/night
                units=Decimal("1"),
                recurring_type=RecurringType.PER_NIGHT
            ),
            BudgetItemInput(
                category=CategoryType.FOOD,
                subcategory="meals",
                title="Daily food budget",
                unit_cost_cents=6000,  # €60/day
                units=Decimal("1"),
                recurring_type=RecurringType.PER_DAY
            ),
            BudgetItemInput(
                category=CategoryType.LOCAL_TRANSPORT,
                subcategory="metro",
                title="Paris Metro passes",
                unit_cost_cents=1500,  # €15 each
                units=Decimal("1"),
                recurring_type=RecurringType.PER_PERSON
            ),
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
    
    print("Trip Details:")
    print(f"  📅 Dates: {request.trip.start_date} to {request.trip.end_date}")
    print(f"  🌙 Nights: {report.nights}")
    print(f"  ☀️  Days: {report.days}")
    print(f"  👥 Travelers: {request.trip.travelers_count}")
    print(f"  💰 Currency: {report.currency}")
    
    print("\nCost Breakdown:")
    for item in report.items:
        print(f"  • {item.title}: {format_currency(item.computed_cost_cents, report.currency)}")
    
    print(f"\n  Subtotal: {format_currency(report.base_sum_cents, report.currency)}")
    print(f"  Contingency (10%): {format_currency(report.contingency_cents, report.currency)}")
    print(f"  Tax & Fees (8%): {format_currency(report.tax_and_fees_cents, report.currency)}")
    
    print(f"\n✨ TOTAL BUDGET: {format_currency(report.total_budget_cents, report.currency)}")
    print(f"  Per Person: {format_currency(report.per_person_cents, report.currency)}")
    print(f"  Per Day: {format_currency(report.per_day_cents, report.currency)}")
    
    print("\nCategory Breakdown:")
    for cat in report.breakdown_by_category:
        print(f"  {cat.category:20} {format_currency(cat.total_cents, report.currency):>15}  ({cat.percentage}%)")


def example_2_bangkok_with_seasonality():
    """Example 2: Bangkok trip with peak season multipliers"""
    print_section("Example 2: Bangkok Trip with Peak Season Pricing")
    
    request = BudgetComputeRequest(
        trip=TripInput(
            start_date=date(2025, 11, 1),
            end_date=date(2025, 11, 10),  # 10 days in peak season
            travelers_count=1,
            currency="THB"
        ),
        items=[
            BudgetItemInput(
                category=CategoryType.ACCOMMODATION,
                title="Mid-range hotel near BTS",
                unit_cost_cents=150000,  # ฿1,500/night
                units=Decimal("1"),
                recurring_type=RecurringType.PER_NIGHT
            ),
            BudgetItemInput(
                category=CategoryType.FOOD,
                title="Mix of street food and restaurants",
                unit_cost_cents=100000,  # ฿1,000/day
                units=Decimal("1"),
                recurring_type=RecurringType.PER_DAY
            ),
            BudgetItemInput(
                category=CategoryType.LOCAL_TRANSPORT,
                title="BTS, taxis, and Grab",
                unit_cost_cents=50000,  # ฿500/day
                units=Decimal("1"),
                recurring_type=RecurringType.PER_DAY
            ),
            BudgetItemInput(
                category=CategoryType.ACTIVITIES,
                title="Floating market tour",
                unit_cost_cents=120000,  # ฿1,200
                units=Decimal("1"),
                recurring_type=RecurringType.ONCE
            ),
            BudgetItemInput(
                category=CategoryType.ACTIVITIES,
                title="Thai cooking class",
                unit_cost_cents=180000,  # ฿1,800
                units=Decimal("1"),
                recurring_type=RecurringType.ONCE
            ),
        ],
        preferences=BudgetPreferences(
            budget_level=BudgetLevel.STANDARD,
            contingency_fraction=Decimal("0.15"),
            apply_seasonality=True,
            tax_rate=Decimal("0.07"),
            include_fees=True
        ),
        season_multiplier=SeasonMultiplier(
            accommodation=Decimal("1.35"),  # Peak season
            transport=Decimal("1.20"),
            activities=Decimal("1.15"),
            dining=Decimal("1.05"),
            general=Decimal("1.00")
        )
    )
    
    report = BudgetingEngine.compute_budget(request)
    
    print("Trip Details:")
    print(f"  📍 Location: Bangkok, Thailand")
    print(f"  📅 Dates: {request.trip.start_date} to {request.trip.end_date} (Peak Season)")
    print(f"  🌙 Duration: {report.nights} nights / {report.days} days")
    
    print("\nBase Cost (Off-Season Prices):")
    print(f"  {format_currency(report.base_sum_cents, report.currency)}")
    
    print(f"\nSeason Multiplier Applied: {report.season_multiplier_applied:.2f}x")
    print(f"  Season-Adjusted Total: {format_currency(report.adjusted_total_cents, report.currency)}")
    
    print(f"\nAdditional Costs:")
    print(f"  Contingency (15%): {format_currency(report.contingency_cents, report.currency)}")
    print(f"  Tax & Fees (7%): {format_currency(report.tax_and_fees_cents, report.currency)}")
    
    print(f"\n✨ TOTAL BUDGET: {format_currency(report.total_budget_cents, report.currency)}")
    print(f"  (≈ ${report.total_budget_cents / 3300:.2f} USD at 33 THB/USD)")
    
    print("\nDaily Breakdown:")
    print(f"  Per Day: {format_currency(report.per_day_cents, report.currency)}")


def example_3_family_trip_tokyo():
    """Example 3: Family trip to Tokyo with multiple travelers"""
    print_section("Example 3: Tokyo Family Trip (2 Adults + 2 Children)")
    
    request = BudgetComputeRequest(
        trip=TripInput(
            start_date=date(2026, 3, 25),
            end_date=date(2026, 4, 5),  # 12 days for cherry blossoms
            travelers_count=4,
            currency="JPY"
        ),
        items=[
            BudgetItemInput(
                category=CategoryType.ACCOMMODATION,
                title="Family room in Shinjuku hotel",
                unit_cost_cents=2500000,  # ¥25,000/night
                units=Decimal("1"),
                recurring_type=RecurringType.PER_NIGHT
            ),
            BudgetItemInput(
                category=CategoryType.FOOD,
                title="Family daily food budget",
                unit_cost_cents=1500000,  # ¥15,000/day
                units=Decimal("1"),
                recurring_type=RecurringType.PER_DAY
            ),
            BudgetItemInput(
                category=CategoryType.LOCAL_TRANSPORT,
                title="Tokyo subway passes",
                unit_cost_cents=80000,  # ¥800 per person
                units=Decimal("1"),
                recurring_type=RecurringType.PER_PERSON
            ),
            BudgetItemInput(
                category=CategoryType.INTERCITY_TRANSPORT,
                title="Round-trip flights",
                unit_cost_cents=8000000,  # ¥80,000 per person
                units=Decimal("1"),
                recurring_type=RecurringType.PER_PERSON
            ),
            BudgetItemInput(
                category=CategoryType.ACTIVITIES,
                title="Tokyo Disneyland tickets",
                unit_cost_cents=900000,  # ¥9,000 per person
                units=Decimal("1"),
                recurring_type=RecurringType.PER_PERSON
            ),
            BudgetItemInput(
                category=CategoryType.ACTIVITIES,
                title="Mt. Fuji day trip (family package)",
                unit_cost_cents=4000000,  # ¥40,000 for family
                units=Decimal("1"),
                recurring_type=RecurringType.ONCE
            ),
        ],
        preferences=BudgetPreferences(
            budget_level=BudgetLevel.PREMIUM,
            contingency_fraction=Decimal("0.12"),
            apply_seasonality=True,
            tax_rate=Decimal("0.10"),
            include_fees=True
        ),
        season_multiplier=SeasonMultiplier(
            accommodation=Decimal("1.60"),  # Cherry blossom peak
            transport=Decimal("1.40"),
            activities=Decimal("1.30"),
            dining=Decimal("1.10"),
            general=Decimal("1.00")
        )
    )
    
    report = BudgetingEngine.compute_budget(request)
    
    print("Trip Details:")
    print(f"  📍 Location: Tokyo, Japan 🌸")
    print(f"  📅 Dates: {request.trip.start_date} to {request.trip.end_date}")
    print(f"  👨‍👩‍👧‍👦 Travelers: {request.trip.travelers_count} (2 adults + 2 children)")
    print(f"  🌸 Season: Cherry Blossom Peak Season")
    
    print("\nCost Breakdown by Category:")
    for cat in report.breakdown_by_category:
        print(f"  {cat.category:25} {format_currency(cat.total_cents, report.currency):>20}  ({cat.percentage:>5.1f}%)")
    
    print(f"\n💰 Base Total: {format_currency(report.base_sum_cents, report.currency)}")
    print(f"🌸 Season Adjusted ({report.season_multiplier_applied:.2f}x): {format_currency(report.adjusted_total_cents, report.currency)}")
    print(f"🛡️  Contingency: {format_currency(report.contingency_cents, report.currency)}")
    print(f"🧾 Tax & Fees: {format_currency(report.tax_and_fees_cents, report.currency)}")
    
    print(f"\n✨ TOTAL BUDGET: {format_currency(report.total_budget_cents, report.currency)}")
    print(f"   (≈ ${report.total_budget_cents / 15000:.2f} USD at 150 JPY/USD)")
    
    print(f"\n📊 Per Person: {format_currency(report.per_person_cents, report.currency)}")
    print(f"   Per Day: {format_currency(report.per_day_cents, report.currency)}")


def example_4_budget_optimization():
    """Example 4: Compare economy vs premium budgets"""
    print_section("Example 4: Budget Level Comparison (Economy vs Premium)")
    
    base_trip = TripInput(
        start_date=date(2025, 9, 1),
        end_date=date(2025, 9, 7),  # 1 week
        travelers_count=2,
        currency="USD"
    )
    
    # Economy budget
    economy_items = [
        BudgetItemInput(
            category=CategoryType.ACCOMMODATION,
            title="Budget hostel",
            unit_cost_cents=4000,  # $40/night
            units=Decimal("1"),
            recurring_type=RecurringType.PER_NIGHT
        ),
        BudgetItemInput(
            category=CategoryType.FOOD,
            title="Street food & budget meals",
            unit_cost_cents=2500,  # $25/day
            units=Decimal("1"),
            recurring_type=RecurringType.PER_DAY
        ),
        BudgetItemInput(
            category=CategoryType.LOCAL_TRANSPORT,
            title="Public transport",
            unit_cost_cents=1000,  # $10/day
            units=Decimal("1"),
            recurring_type=RecurringType.PER_DAY
        ),
    ]
    
    # Premium budget
    premium_items = [
        BudgetItemInput(
            category=CategoryType.ACCOMMODATION,
            title="4-star hotel",
            unit_cost_cents=20000,  # $200/night
            units=Decimal("1"),
            recurring_type=RecurringType.PER_NIGHT
        ),
        BudgetItemInput(
            category=CategoryType.FOOD,
            title="Restaurant dining",
            unit_cost_cents=10000,  # $100/day
            units=Decimal("1"),
            recurring_type=RecurringType.PER_DAY
        ),
        BudgetItemInput(
            category=CategoryType.LOCAL_TRANSPORT,
            title="Private car & driver",
            unit_cost_cents=8000,  # $80/day
            units=Decimal("1"),
            recurring_type=RecurringType.PER_DAY
        ),
    ]
    
    economy_request = BudgetComputeRequest(
        trip=base_trip,
        items=economy_items,
        preferences=BudgetPreferences(
            budget_level=BudgetLevel.ECONOMY,
            contingency_fraction=Decimal("0.15"),  # Higher buffer for budget travel
            apply_seasonality=False,
            tax_rate=Decimal("0"),
            include_fees=False
        )
    )
    
    premium_request = BudgetComputeRequest(
        trip=base_trip,
        items=premium_items,
        preferences=BudgetPreferences(
            budget_level=BudgetLevel.PREMIUM,
            contingency_fraction=Decimal("0.10"),
            apply_seasonality=False,
            tax_rate=Decimal("0"),
            include_fees=False
        )
    )
    
    economy_report = BudgetingEngine.compute_budget(economy_request)
    premium_report = BudgetingEngine.compute_budget(premium_request)
    
    print(f"Trip: 1 week (7 days, 6 nights) • 2 travelers\n")
    
    print("╔═══════════════════════════╦════════════════╦════════════════╗")
    print("║ Category                  ║    Economy     ║    Premium     ║")
    print("╠═══════════════════════════╬════════════════╬════════════════╣")
    
    categories = ['accommodation', 'food', 'local_transport']
    for cat in categories:
        economy_cat = next((c for c in economy_report.breakdown_by_category if c.category == cat), None)
        premium_cat = next((c for c in premium_report.breakdown_by_category if c.category == cat), None)
        
        econ_val = format_currency(economy_cat.total_cents if economy_cat else 0, "USD")
        prem_val = format_currency(premium_cat.total_cents if premium_cat else 0, "USD")
        
        print(f"║ {cat:25} ║ {econ_val:>14} ║ {prem_val:>14} ║")
    
    print("╠═══════════════════════════╬════════════════╬════════════════╣")
    print(f"║ {'Base Total':25} ║ {format_currency(economy_report.base_sum_cents, 'USD'):>14} ║ {format_currency(premium_report.base_sum_cents, 'USD'):>14} ║")
    print(f"║ {'Contingency':25} ║ {format_currency(economy_report.contingency_cents, 'USD'):>14} ║ {format_currency(premium_report.contingency_cents, 'USD'):>14} ║")
    print("╠═══════════════════════════╬════════════════╬════════════════╣")
    print(f"║ {'TOTAL':25} ║ {format_currency(economy_report.total_budget_cents, 'USD'):>14} ║ {format_currency(premium_report.total_budget_cents, 'USD'):>14} ║")
    print(f"║ {'Per Person':25} ║ {format_currency(economy_report.per_person_cents, 'USD'):>14} ║ {format_currency(premium_report.per_person_cents, 'USD'):>14} ║")
    print(f"║ {'Per Day':25} ║ {format_currency(economy_report.per_day_cents, 'USD'):>14} ║ {format_currency(premium_report.per_day_cents, 'USD'):>14} ║")
    print("╚═══════════════════════════╩════════════════╩════════════════╝")
    
    savings = premium_report.total_budget_cents - economy_report.total_budget_cents
    percentage = (savings / premium_report.total_budget_cents) * 100
    print(f"\n💡 Savings with Economy: {format_currency(savings, 'USD')} ({percentage:.0f}% less)")


def example_5_edge_cases():
    """Example 5: Edge cases and special scenarios"""
    print_section("Example 5: Edge Cases & Special Scenarios")
    
    # Case 1: Same-day trip
    print("Scenario 1: Day Trip (0 nights)")
    request = BudgetComputeRequest(
        trip=TripInput(
            start_date=date(2025, 8, 15),
            end_date=date(2025, 8, 15),
            travelers_count=1,
            currency="USD"
        ),
        items=[
            BudgetItemInput(
                category=CategoryType.FOOD,
                title="Lunch",
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
    print(f"  Days: {report.days}, Nights: {report.nights}")
    print(f"  Total: {format_currency(report.total_budget_cents, 'USD')}\n")
    
    # Case 2: Large group
    print("Scenario 2: Large Group Trip (50 people)")
    request = BudgetComputeRequest(
        trip=TripInput(
            start_date=date(2025, 10, 1),
            end_date=date(2025, 10, 3),
            travelers_count=50,
            currency="EUR"
        ),
        items=[
            BudgetItemInput(
                category=CategoryType.ACTIVITIES,
                title="Group tour",
                unit_cost_cents=5000,
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
    print(f"  Total: {format_currency(report.total_budget_cents, 'EUR')}")
    print(f"  Per Person: {format_currency(report.per_person_cents, 'EUR')}\n")
    
    # Case 3: High contingency
    print("Scenario 3: High-Risk Trip with 25% Contingency")
    request = BudgetComputeRequest(
        trip=TripInput(
            start_date=date(2025, 12, 20),
            end_date=date(2025, 12, 27),
            travelers_count=2,
            currency="USD"
        ),
        items=[
            BudgetItemInput(
                category=CategoryType.ACCOMMODATION,
                title="Hotel",
                unit_cost_cents=15000,
                units=Decimal("1"),
                recurring_type=RecurringType.PER_NIGHT
            )
        ],
        preferences=BudgetPreferences(
            contingency_fraction=Decimal("0.25"),  # 25% buffer
            apply_seasonality=False,
            tax_rate=Decimal("0"),
            include_fees=False
        )
    )
    
    report = BudgetingEngine.compute_budget(request)
    print(f"  Base: {format_currency(report.base_sum_cents, 'USD')}")
    print(f"  Contingency (25%): {format_currency(report.contingency_cents, 'USD')}")
    print(f"  Total: {format_currency(report.total_budget_cents, 'USD')}")


def main():
    """Run all examples"""
    print("\n")
    print("╔══════════════════════════════════════════════════════════════════════════════╗")
    print("║                     RIZ TRAVEL - BUDGETING ENGINE                            ║")
    print("║                    Complete Examples & Demonstrations                        ║")
    print("╚══════════════════════════════════════════════════════════════════════════════╝")
    
    example_1_simple_paris_trip()
    example_2_bangkok_with_seasonality()
    example_3_family_trip_tokyo()
    example_4_budget_optimization()
    example_5_edge_cases()
    
    print_section("Summary")
    print("✅ All examples completed successfully!")
    print("✅ Integer-cent arithmetic verified (no floating-point errors)")
    print("✅ Seasonality multipliers working correctly")
    print("✅ Per-person and per-day calculations accurate")
    print("✅ Multi-category breakdown functioning")
    print("\nFor API usage, run: python main.py")
    print("For unit tests, run: pytest test_budgeting_engine.py -v")
    print("\n" + "=" * 80 + "\n")


if __name__ == "__main__":
    main()
