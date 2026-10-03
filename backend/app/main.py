from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, dashboard, patients, beds, staff, resources, events, alerts, predictions, bottlenecks, orchestration, emergencies, analytics, staff_portal

app = FastAPI(title="FlowOS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(patients.router)
app.include_router(beds.router)
app.include_router(staff.router)
app.include_router(resources.router)
app.include_router(events.router)
app.include_router(alerts.router)
app.include_router(predictions.router)
app.include_router(bottlenecks.router)
app.include_router(orchestration.router)
app.include_router(emergencies.router)
app.include_router(analytics.router)
app.include_router(staff_portal.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
