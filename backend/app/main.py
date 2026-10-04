from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    alerts,
    analytics,
    anomalies,
    auth,
    beds,
    bottlenecks,
    caretaker,
    dashboard,
    emergencies,
    events,
    intelligence,
    orchestration,
    patients,
    predictions,
    resources,
    rfid,
    speech,
    staff,
    staff_portal,
    forecast,
    decision_engine,
    ws,
)

app = FastAPI(title="FlowOS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"^https?://.*",
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
app.include_router(caretaker.router)
app.include_router(caretaker.compat_router)
app.include_router(speech.router)
app.include_router(rfid.router)
app.include_router(intelligence.router)
app.include_router(anomalies.router)
app.include_router(forecast.router)
app.include_router(decision_engine.router)
app.include_router(ws.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
