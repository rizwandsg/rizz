# Microservices Architecture - RIZ Travel App

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  iOS App  │  Android App  │  Web SPA (React)  │  Admin Portal          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            CDN + WAF                                     │
│                   (CloudFlare / CloudFront)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY / EDGE                                │
│           (Kong / AWS API Gateway / Nginx + Custom)                     │
│  - JWT Authentication          - Rate Limiting                          │
│  - Request Routing             - TLS Termination                        │
│  - Request/Response Transform  - API Versioning                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  Auth/IAM     │         │  User Profile │         │  Trip Service │
│  Service      │         │  Service      │         │               │
│  :8001        │         │  :8002        │         │  :8003        │
│               │         │               │         │               │
│ • OAuth2/JWT  │         │ • Preferences │         │ • Trip CRUD   │
│ • Roles/Perms │         │ • Saved Trips │         │ • Collab      │
│ • 2FA         │         │ • Payment     │         │ • Sharing     │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  ▼
                        ┌─────────────────┐
                        │  PostgreSQL     │
                        │  (Primary DB)   │
                        │  + Read Replica │
                        └─────────────────┘

┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  Budgeting    │         │  Planner/     │         │  Transport    │
│  Engine       │         │  Itinerary    │         │  Optimizer    │
│  :8004        │         │  :8005        │         │  :8006        │
│               │         │               │         │               │
│ • Category    │         │ • Day Sched   │         │ • Multi-modal │
│ • Seasonality │         │ • Activities  │         │ • Routing     │
│ • Per-person  │◄────────│ • Time Window │◄────────│ • Pareto      │
└───────┬───────┘         └───────┬───────┘         └───────────────┘
        │                         │
        ▼                         ▼
┌─────────────────┐     ┌─────────────────┐
│  Redis Cache    │     │  OpenSearch     │
│  (Hot Data)     │     │  (POI Search)   │
└─────────────────┘     └─────────────────┘

┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  Pricing      │         │  Search       │         │  Marketplace/ │
│  Aggregator   │         │  Service      │         │  Operators    │
│  :8007        │         │  :8008        │         │  :8009        │
│               │         │               │         │               │
│ • Provider    │         │ • Geo Search  │         │ • Listings    │
│   Integration │         │ • POI Index   │         │ • Onboarding  │
│ • Price Cache │         │ • Activities  │         │ • Reviews     │
└───────┬───────┘         └───────────────┘         └───────┬───────┘
        │                                                     │
        ▼                                                     ▼
┌─────────────────┐                                 ┌─────────────────┐
│  Cassandra      │                                 │  PostgreSQL     │
│  (Price History)│                                 │  (Operators)    │
└─────────────────┘                                 └─────────────────┘

┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  Booking &    │         │  Notification │         │  Analytics    │
│  Payments     │         │  Service      │         │  Service      │
│  :8010        │         │  :8011        │         │  :8012        │
│               │         │               │         │               │
│ • Stripe/     │         │ • Email/SMS   │         │ • Event Track │
│   Adyen       │         │ • Push Notif  │         │ • Data Lake   │
│ • Invoices    │         │ • Webhooks    │         │ • ML Pipeline │
└───────┬───────┘         └───────────────┘         └───────┬───────┘
        │                                                     │
        └─────────────────────┬───────────────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │  Apache Kafka   │
                    │  (Event Stream) │
                    │                 │
                    │ Topics:         │
                    │ • bookings      │
                    │ • price-updates │
                    │ • user-events   │
                    │ • notifications │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Worker Pool    │
                    │  (K8s Jobs)     │
                    │                 │
                    │ • Price Refresh │
                    │ • ML Inference  │
                    │ • Exports       │
                    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     CROSS-CUTTING SERVICES                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Monitoring (Prometheus + Grafana)  │  Logging (ELK)  │  Tracing (Jaeger)│
└─────────────────────────────────────────────────────────────────────────┘
```

## Service Specifications

### 1. Auth/IAM Service (Port: 8001)

**Responsibilities:**
- User authentication (OAuth2, JWT)
- Role & permission management
- Organization/tenant management
- 2FA & MFA support
- Session management

**Tech Stack:** Node.js (NestJS), PostgreSQL, Redis

**Dependencies:**
- PostgreSQL (users, roles, permissions)
- Redis (session cache, token blacklist)

**APIs:**
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
POST   /auth/2fa/enable
POST   /auth/2fa/verify
GET    /auth/permissions
```

**Scaling:** Stateless, horizontal scaling with shared Redis

---

### 2. User Profile Service (Port: 8002)

**Responsibilities:**
- User preferences & settings
- Default currency, travel style
- Saved trips & favorites
- Payment instrument tokens (Stripe)

**Tech Stack:** Python (FastAPI), PostgreSQL

**Dependencies:**
- PostgreSQL (user_profiles, preferences)
- Redis (profile cache)

**APIs:**
```
GET    /users/{id}/profile
PUT    /users/{id}/profile
GET    /users/{id}/preferences
PUT    /users/{id}/preferences
GET    /users/{id}/saved-trips
POST   /users/{id}/payment-methods
```

**Scaling:** Read-heavy; read replicas + caching

---

### 3. Trip Service (Port: 8003)

**Responsibilities:**
- Trip CRUD operations
- Multi-user collaboration (roles, invites)
- Trip sharing & privacy settings
- Comments & activity feed

**Tech Stack:** Node.js (NestJS), PostgreSQL, Redis

**Dependencies:**
- PostgreSQL (trips, trip_collaborators, trip_items)
- Kafka (trip events)
- Redis (collaboration state)

**APIs:**
```
POST   /trips
GET    /trips/{id}
PUT    /trips/{id}
DELETE /trips/{id}
POST   /trips/{id}/collaborators
GET    /trips/{id}/activity-feed
POST   /trips/{id}/comments
```

**Scaling:** Shard by user_id or org_id; WebSocket for real-time collab

---

### 4. Budgeting Engine (Port: 8004)

**Responsibilities:**
- Budget computation (category-based)
- Seasonality multipliers
- Contingency & tax/fee estimation
- Per-person cost splitting
- What-if scenario generation

**Tech Stack:** Python (FastAPI), PostgreSQL, Redis

**Dependencies:**
- PostgreSQL (season_profiles, default_costs)
- Redis (computation cache)
- Trip Service (trip data)

**APIs:**
```
POST   /budget/compute
GET    /budget/scenarios/{trip_id}
POST   /budget/optimize
GET    /locations/{id}/season-profile
POST   /budget/categories/defaults
```

**Scaling:** CPU-intensive; auto-scale on compute load

---

### 5. Planner/Itinerary Service (Port: 8005)

**Responsibilities:**
- Day-by-day itinerary generation
- Activity scheduling with time windows
- Travel time integration
- Budget-aware scheduling

**Tech Stack:** Python (FastAPI), PostgreSQL, Redis

**Dependencies:**
- Search Service (POI candidates)
- Transport Optimizer (travel times)
- Budgeting Engine (budget constraints)
- OpenSearch (activity lookup)

**APIs:**
```
POST   /planner/{trip_id}/generate
GET    /planner/{trip_id}/itinerary
PUT    /planner/{trip_id}/day/{day}
POST   /planner/{trip_id}/activity/add
DELETE /planner/{trip_id}/activity/{id}
```

**Scaling:** Async job processing for complex itineraries

---

### 6. Transport Optimizer (Port: 8006)

**Responsibilities:**
- Multi-modal routing (flight, train, bus, car, walk)
- Cost/time/comfort trade-off analysis
- Pareto frontier computation
- Local transit integration (GTFS)

**Tech Stack:** Go (high performance), PostgreSQL

**Dependencies:**
- External APIs (Google Directions, GTFS feeds)
- Redis (route cache)

**APIs:**
```
GET    /transport/options?origin&dest&date&criteria
GET    /transport/route/{id}
POST   /transport/multi-leg
GET    /transport/local-transit?lat&lon
```

**Scaling:** Heavy caching; rate-limit external APIs

---

### 7. Pricing Aggregator (Port: 8007)

**Responsibilities:**
- Multi-provider price collection
- Price normalization & caching
- Historical price storage
- Price change detection

**Tech Stack:** Node.js (NestJS), Cassandra, Redis

**Dependencies:**
- Cassandra (price_points time-series)
- Redis (hot price cache)
- External APIs (Skyscanner, Booking.com, etc.)
- Kafka (price-update events)

**APIs:**
```
GET    /prices/flights?origin&dest&date
GET    /prices/hotels?location&checkin&checkout
GET    /prices/history/{listing_id}
POST   /prices/refresh
GET    /prices/forecast/{listing_id}
```

**Scaling:** Worker pool for scraping; partition Cassandra by provider

---

### 8. Search Service (Port: 8008)

**Responsibilities:**
- Geo-spatial search
- POI & activity indexing
- Full-text search
- Faceted filtering

**Tech Stack:** Python (FastAPI), OpenSearch

**Dependencies:**
- OpenSearch (poi index)
- PostgreSQL (canonical data)

**APIs:**
```
GET    /search?q&lat&lon&radius&category
GET    /search/poi/{id}
POST   /search/index/poi
DELETE /search/index/poi/{id}
GET    /search/suggest?q
```

**Scaling:** Scale OpenSearch cluster; optimize index sharding

---

### 9. Marketplace/Operators Service (Port: 8009)

**Responsibilities:**
- Operator onboarding & KYC
- Listing management (experiences, tours)
- Availability & pricing calendars
- Reviews & ratings
- Contract & payout management

**Tech Stack:** Node.js (NestJS), PostgreSQL

**Dependencies:**
- PostgreSQL (operators, listings, reviews)
- Stripe Connect (payouts)
- Kafka (booking events)

**APIs:**
```
POST   /operators/onboard
GET    /operators/{id}
POST   /operators/{id}/listings
GET    /marketplace/listings?location&category
GET    /marketplace/listing/{id}
POST   /marketplace/listing/{id}/review
```

**Scaling:** Read replicas; CDN for listing images

---

### 10. Booking & Payments Service (Port: 8010)

**Responsibilities:**
- Booking creation & management
- Payment processing (Stripe/Adyen)
- Invoice generation
- Refund handling
- Provider webhook callbacks

**Tech Stack:** Node.js (NestJS), PostgreSQL, Kafka

**Dependencies:**
- PostgreSQL (bookings, transactions)
- Stripe/Adyen APIs
- Kafka (booking events)
- Notification Service

**APIs:**
```
POST   /bookings
GET    /bookings/{id}
PUT    /bookings/{id}/cancel
POST   /payments/intent
POST   /payments/confirm
GET    /payments/{id}/invoice
POST   /webhooks/stripe
```

**Scaling:** Idempotency keys; exactly-once payment processing

---

### 11. Notification Service (Port: 8011)

**Responsibilities:**
- Email notifications (SendGrid/SES)
- SMS (Twilio)
- Push notifications (FCM/APNS)
- Webhook delivery to operators
- Template management

**Tech Stack:** Python (FastAPI), PostgreSQL, Kafka

**Dependencies:**
- Kafka (notification events)
- SendGrid/SES, Twilio, FCM
- PostgreSQL (notification logs)

**APIs:**
```
POST   /notifications/send
GET    /notifications/templates
POST   /notifications/webhooks/register
GET    /notifications/history/{user_id}
```

**Scaling:** Async queue processing; retry with exponential backoff

---

### 12. Analytics Service (Port: 8012)

**Responsibilities:**
- Event tracking & ingestion
- Data lake management (S3)
- ML training pipeline orchestration
- Reporting & dashboards
- A/B test result aggregation

**Tech Stack:** Python (FastAPI), PostgreSQL, S3, Airflow

**Dependencies:**
- Kafka (event stream)
- S3 (data lake)
- Redshift/BigQuery (warehouse)
- Airflow (orchestration)

**APIs:**
```
POST   /analytics/events
GET    /analytics/reports/{type}
GET    /analytics/dashboard/{user_id}
POST   /analytics/ml/train
GET    /analytics/ab-test/{experiment_id}
```

**Scaling:** Stream processing with Kafka Streams; batch ETL jobs

---

## Inter-Service Communication

### Synchronous (REST/gRPC)
- Auth validation (all services → Auth Service)
- Budget computation (Planner → Budgeting Engine)
- Search queries (Planner → Search Service)

### Asynchronous (Kafka Events)
- Booking created → Notification, Analytics
- Price updated → Pricing cache invalidation
- Trip shared → Notification to collaborators

### Caching Strategy
- User profiles: Redis (5 min TTL)
- Prices: Redis (15 min TTL)
- Season profiles: Redis (24 hr TTL)
- Search results: Redis (1 hr TTL)

## Service Discovery & Load Balancing

- **K8s Services** for internal DNS (service-name.namespace.svc.cluster.local)
- **Istio** for service mesh (optional, traffic splitting, circuit breaking)
- **Round-robin** for stateless services
- **Sticky sessions** for real-time collaboration (WebSocket)

## Health Checks

All services expose:
```
GET /health/live   - Liveness probe (is process alive?)
GET /health/ready  - Readiness probe (can serve traffic?)
```

## Observability

- **Metrics**: Each service exports Prometheus metrics on `/metrics`
- **Tracing**: Jaeger trace context propagated via HTTP headers
- **Logging**: Structured JSON logs to stdout → fluentd → ELK
