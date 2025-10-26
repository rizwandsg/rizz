# Getting Started with RIZ Travel App

Quick guide to get the RIZ Travel App running locally in under 15 minutes.

## Prerequisites

- **Python 3.11+** (for Budgeting Engine)
- **PostgreSQL 14+** with PostGIS (for database)
- **Docker** (optional, for containerized setup)
- **Git** (to clone the repository)

## Option 1: Quick Local Setup (Recommended)

### Step 1: Database Setup

#### Using Docker (Easiest)

```bash
# Start PostgreSQL with PostGIS
docker run -d \
  --name riz-postgres \
  -e POSTGRES_PASSWORD=riztravel123 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=riztravel \
  -p 5432:5432 \
  postgis/postgis:14-3.3

# Wait for PostgreSQL to be ready (10-15 seconds)
sleep 15
```

#### Using Local PostgreSQL

```bash
# Install PostgreSQL and PostGIS extension
sudo apt-get install postgresql-14 postgresql-14-postgis-3  # Ubuntu/Debian
# or
brew install postgresql postgis  # macOS

# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
# or
brew services start postgresql  # macOS

# Create database
createdb riztravel
psql -d riztravel -c "CREATE EXTENSION postgis;"
```

### Step 2: Load Database Schema & Seed Data

```bash
# Navigate to database directory
cd database/postgres

# Load schema
psql -h localhost -U postgres -d riztravel -f schema.sql

# Load seed data (sample locations, users, trips)
psql -h localhost -U postgres -d riztravel -f seed.sql

# Verify data loaded
psql -h localhost -U postgres -d riztravel -c "SELECT COUNT(*) FROM users;"
# Should show: 6 users
```

### Step 3: Run Budgeting Engine

```bash
# Navigate to budgeting engine
cd ../../services/budgeting-engine

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run tests to verify everything works
pytest test_budgeting_engine.py -v
# All 20 tests should pass

# Run example scenarios
python example_usage.py
# You'll see 5 budget computation examples with detailed output

# Start the API server
python main.py
# Server will start at http://localhost:8004
```

### Step 4: Test the API

Open a new terminal and test the API:

```bash
# Health check
curl http://localhost:8004/health/ready

# Compute a simple budget
curl -X POST http://localhost:8004/budget/compute \
  -H "Content-Type: application/json" \
  -d '{
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
        "units": 1,
        "recurring_type": "per_night"
      },
      {
        "category": "food",
        "title": "Meals",
        "unit_cost_cents": 5000,
        "units": 1,
        "recurring_type": "per_day"
      }
    ],
    "preferences": {
      "budget_level": "standard",
      "contingency_fraction": 0.10,
      "apply_seasonality": false,
      "tax_rate": 0.08,
      "include_fees": true
    }
  }'
```

Expected response:
```json
{
  "base_sum_cents": 124000,
  "days": 8,
  "nights": 7,
  "season_multiplier_applied": 1.0,
  "adjusted_total_cents": 124000,
  "contingency_cents": 12400,
  "tax_and_fees_cents": 9920,
  "total_budget_cents": 146320,
  "per_person_cents": 73160,
  "per_day_cents": 18290,
  "items": [...],
  "breakdown_by_category": [...],
  "currency": "EUR",
  "computed_at": "2025-10-26T..."
}
```

**Congratulations! 🎉 You're now running the RIZ Budgeting Engine.**

---

## Option 2: Docker Compose (Everything Containerized)

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:14-3.3
    environment:
      POSTGRES_PASSWORD: riztravel123
      POSTGRES_USER: postgres
      POSTGRES_DB: riztravel
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/postgres:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  budgeting-engine:
    build: ./services/budgeting-engine
    ports:
      - "8004:8004"
    environment:
      - DATABASE_URL=postgresql://postgres:riztravel123@postgres:5432/riztravel
      - PORT=8004
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8004/health/ready"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  postgres_data:
```

Then run:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f budgeting-engine

# Test API
curl http://localhost:8004/health/ready
```

---

## Option 3: Kubernetes Deployment

For production or Kubernetes development:

```bash
# Create namespace
kubectl create namespace riz-travel

# Apply database (use a proper managed DB in production)
kubectl apply -f infrastructure/kubernetes/postgres.yaml  # You'll need to create this

# Apply budgeting engine
kubectl apply -f infrastructure/kubernetes/budgeting-engine.yaml

# Check deployment
kubectl get pods -n riz-travel

# Port forward to test locally
kubectl port-forward -n riz-travel deployment/budgeting-engine 8004:8004

# Test
curl http://localhost:8004/health/ready
```

---

## Next Steps

### 1. Explore the Database

```bash
psql -h localhost -U postgres -d riztravel

# View sample trips
SELECT id, title, destination_name, start_date, end_date, travelers_count 
FROM trips WHERE deleted_at IS NULL;

# View season profiles
SELECT l.name, sp.name, sr.season_name, sr.start_month, sr.end_month, 
       sr.accommodation_multiplier
FROM locations l
JOIN season_profiles sp ON l.id = sp.location_id
JOIN season_rules sr ON sp.id = sr.season_profile_id
ORDER BY l.name, sr.start_month;

# View default costs
SELECT l.name, dcc.budget_level, dcc.category, dcc.unit_cost_cents / 100.0 AS price, 
       dcc.currency, dcc.recurring_type
FROM default_category_costs dcc
JOIN locations l ON dcc.location_id = l.id
ORDER BY l.name, dcc.category;
```

### 2. Run More Examples

```bash
cd services/budgeting-engine

# Run the comprehensive example file
python example_usage.py
# This will show 5 different budget scenarios with beautiful formatting
```

### 3. Explore the API

Visit http://localhost:8004/docs for interactive Swagger documentation.

### 4. Write Your Own Budget Computation

Create a file `my_budget.py`:

```python
from main import BudgetingEngine, BudgetComputeRequest, TripInput, BudgetItemInput, BudgetPreferences, CategoryType, RecurringType
from datetime import date
from decimal import Decimal

request = BudgetComputeRequest(
    trip=TripInput(
        start_date=date(2025, 12, 1),
        end_date=date(2025, 12, 7),
        travelers_count=2,
        currency="USD"
    ),
    items=[
        BudgetItemInput(
            category=CategoryType.ACCOMMODATION,
            title="Airbnb",
            unit_cost_cents=15000,  # $150/night
            units=Decimal("1"),
            recurring_type=RecurringType.PER_NIGHT
        ),
        # Add more items...
    ],
    preferences=BudgetPreferences()
)

report = BudgetingEngine.compute_budget(request)
print(f"Total Budget: ${report.total_budget_cents / 100:.2f}")
print(f"Per Person: ${report.per_person_cents / 100:.2f}")
```

Run it:
```bash
python my_budget.py
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres
# or
pg_isready -h localhost -p 5432

# Check connection
psql -h localhost -U postgres -d riztravel -c "SELECT version();"
```

### Python Import Errors

```bash
# Make sure virtual environment is activated
which python  # Should show path to venv

# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Port Already in Use

```bash
# Check what's using port 8004
lsof -i :8004  # macOS/Linux
netstat -ano | findstr :8004  # Windows

# Kill the process or use a different port
PORT=8005 python main.py
```

### Tests Failing

```bash
# Run tests with verbose output
pytest test_budgeting_engine.py -v -s

# Run a specific test
pytest test_budgeting_engine.py::TestDaysComputation::test_week_long_trip -v
```

---

## Learning Resources

1. **Budgeting Engine**: Read `services/budgeting-engine/README.md`
2. **Database Schema**: Study `database/postgres/schema.sql` comments
3. **Architecture**: Review `docs/architecture/microservices-overview.md`
4. **Examples**: Run and modify `services/budgeting-engine/example_usage.py`

---

## Project Structure at a Glance

```
rizz/
├── README.md                    # Project overview
├── IMPLEMENTATION_SUMMARY.md    # What's been built
├── GETTING_STARTED.md          # This file
├── docs/
│   └── architecture/           # Architecture documentation
├── infrastructure/
│   └── kubernetes/             # K8s deployment configs
├── database/
│   └── postgres/
│       ├── schema.sql          # DB schema (run this first)
│       └── seed.sql            # Sample data (run second)
└── services/
    └── budgeting-engine/
        ├── main.py             # FastAPI app
        ├── test_budgeting_engine.py  # Unit tests
        ├── example_usage.py    # Usage examples
        └── requirements.txt    # Python dependencies
```

---

## Common Commands Cheat Sheet

```bash
# Start everything (Docker Compose)
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f budgeting-engine

# Run tests
pytest test_budgeting_engine.py -v

# Start API server
python main.py

# Test API health
curl http://localhost:8004/health/ready

# Database connection
psql -h localhost -U postgres -d riztravel

# Restart PostgreSQL (Docker)
docker restart riz-postgres
```

---

## Need Help?

- Check `IMPLEMENTATION_SUMMARY.md` for what's included
- Read service-specific READMEs for detailed docs
- Run example code to see working examples
- Check test files for usage patterns

---

**Happy Coding! 🚀**

Built with ❤️ for RIZ Travel
