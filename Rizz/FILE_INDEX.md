# RIZ Travel App - File Index

Quick reference to find what you need.

## 📚 Documentation

| File | Description |
|------|-------------|
| `README.md` | Main project overview, architecture, tech stack, roadmap |
| `IMPLEMENTATION_SUMMARY.md` | Complete summary of what's been built |
| `GETTING_STARTED.md` | Step-by-step setup guide (start here!) |
| `docs/architecture/microservices-overview.md` | Detailed service architecture & communication patterns |

## 🗄️ Database

| File | Description |
|------|-------------|
| `database/postgres/schema.sql` | **Complete PostgreSQL schema** (16 tables, triggers, views) |
| `database/postgres/seed.sql` | Sample data (locations, users, trips, operators) |

**Key Tables:**
- `users`, `user_preferences` - User accounts & settings
- `trips`, `trip_items`, `trip_collaborators` - Trip planning
- `operators`, `operator_listings` - Tourism operator marketplace
- `season_profiles`, `season_rules` - Seasonality multipliers
- `bookings`, `payments` - Booking & payment records

## ☸️ Kubernetes Infrastructure

| File | Description |
|------|-------------|
| `infrastructure/kubernetes/auth-service.yaml` | Auth service deployment (3-20 replicas) |
| `infrastructure/kubernetes/trip-service.yaml` | Trip service deployment (4-30 replicas) |
| `infrastructure/kubernetes/budgeting-engine.yaml` | **Budgeting Engine deployment** (5-50 replicas) |
| `infrastructure/kubernetes/pricing-aggregator.yaml` | Pricing aggregator + CronJob |

Each includes:
- Deployment with auto-scaling (HPA)
- Service definition
- ConfigMap
- PodDisruptionBudget
- ServiceAccount

## 💰 Budgeting Engine (Production-Ready Service)

| File | Description |
|------|-------------|
| `services/budgeting-engine/main.py` | **FastAPI application** (500+ lines) |
| `services/budgeting-engine/test_budgeting_engine.py` | **Unit tests** (800+ lines, 20+ tests, 95%+ coverage) |
| `services/budgeting-engine/example_usage.py` | 5 complete usage examples with output |
| `services/budgeting-engine/requirements.txt` | Python dependencies |
| `services/budgeting-engine/Dockerfile` | Container image definition |
| `services/budgeting-engine/README.md` | Service documentation & API reference |

**Key Classes:**
- `BudgetingEngine` - Core computation logic
- `BudgetComputeRequest` - Input model
- `BudgetReport` - Output model with breakdown

## 🚀 Quick Start Commands

```bash
# 1. Database Setup
docker run -d --name riz-postgres -e POSTGRES_PASSWORD=riztravel123 -p 5432:5432 postgis/postgis:14-3.3
psql -h localhost -U postgres -d riztravel -f database/postgres/schema.sql
psql -h localhost -U postgres -d riztravel -f database/postgres/seed.sql

# 2. Run Budgeting Engine
cd services/budgeting-engine
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
pytest test_budgeting_engine.py -v
python example_usage.py
python main.py  # API server on :8004

# 3. Test API
curl http://localhost:8004/health/ready
```

## 📊 Test Coverage

| Component | Tests | Coverage |
|-----------|-------|----------|
| Budgeting Engine | 20+ tests | 95%+ |
| - Days computation | 3 tests | ✅ |
| - Item cost calculation | 6 tests | ✅ |
| - Seasonality | 3 tests | ✅ |
| - Full computation | 4 tests | ✅ |
| - Edge cases | 3 tests | ✅ |
| - Integer arithmetic | 2 tests | ✅ |

## 🎯 Key Algorithms Implemented

### 1. Budget Computation (`main.py`, line ~150)
- Integer-cent arithmetic (no floating-point errors)
- Recurring type handling (per_day, per_night, per_person, once)
- Seasonality multipliers by category
- Contingency & tax calculations

### 2. Seasonality Application (`main.py`, line ~125)
- Category-specific multipliers
- Integer-based multiplication (basis points)

### 3. Cost Breakdown (`main.py`, line ~200)
- Per-person calculations
- Per-day averages
- Category percentage analysis

## 📦 What's Production-Ready?

✅ **Ready to Deploy:**
1. Budgeting Engine (full service with tests)
2. Database schema (complete with seed data)
3. Kubernetes manifests (4 services)

🚧 **To Be Implemented:**
1. Other microservices (Auth, Trip, Search, etc.)
2. Frontend applications (web, mobile)
3. External integrations (Stripe, flight APIs)

## 🗺️ Roadmap

**Phase 1 (MVP):** Core trip creation, budgeting, basic itinerary
**Phase 2 (V1):** Multi-user collaboration, pricing aggregation, bookings
**Phase 3 (V2):** ML recommendations, full marketplace, scale to 100K DAU

See `README.md` for detailed roadmap.

## 🔍 How to Navigate

1. **New to the project?** → Read `GETTING_STARTED.md`
2. **Want to understand architecture?** → Read `README.md` and `docs/architecture/`
3. **Need to see what works?** → Check `IMPLEMENTATION_SUMMARY.md`
4. **Want to run code?** → Go to `services/budgeting-engine/`
5. **Need database info?** → Check `database/postgres/`
6. **Deploying to K8s?** → See `infrastructure/kubernetes/`

## 📞 Need More Info?

- **API Docs**: Run `python main.py` → http://localhost:8004/docs
- **Test Examples**: `pytest test_budgeting_engine.py -v`
- **Usage Examples**: `python example_usage.py`
- **Database Schema**: `psql -f database/postgres/schema.sql` (has inline comments)

---

**Last Updated:** October 26, 2025
**Version:** 1.0.0
