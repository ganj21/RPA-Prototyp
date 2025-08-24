import os
import sys
import json
from typing import Optional
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ❗ sys import nicht vergessen
import sys

# 🧠 Pfad zur orchestrator-Logik hinzufügen
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from orchestrator.run_workflow import run_rpa_workflow

app = FastAPI()

# 🔓 CORS für das Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📁 Pfad zum artifacts-Ordner
ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../artifacts"))

# 🔄 Root-Endpoint zur Kontrolle
@app.get("/")
def read_root():
    return {"message": "Backend is running"}

# 🔄 Workflows auflisten
@app.get("/workflows")
def list_workflows():
    if not os.path.exists(ARTIFACTS_DIR):
        os.makedirs(ARTIFACTS_DIR)

    files = [
        f for f in os.listdir(ARTIFACTS_DIR)
        if f.endswith(".json") and not f.startswith("schedule")
    ]
    return {"workflows": files}

# 💾 Workflow hochladen
@app.post("/upload")
async def upload_workflow(file: UploadFile = File(...)):
    contents = await file.read()
    save_path = os.path.join(ARTIFACTS_DIR, file.filename)
    with open(save_path, "wb") as f:
        f.write(contents)
    return {"filename": file.filename}

# ▶️ Workflow starten
@app.post("/run/{name}")
def run_workflow(name: str):
    try:
        run_rpa_workflow(name)
        return {"status": "success", "message": f"Workflow '{name}' started"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 🕒 Zeitplan speichern
class ScheduleRequest(BaseModel):
    workflow: str
    cron: Optional[str] = None       # z. B. '0 9 * * 1'
    time: Optional[str] = None       # z. B. '08:00'
    once: Optional[bool] = False

@app.post("/schedule")
def save_schedule(req: ScheduleRequest):
    schedule_path = os.path.join(ARTIFACTS_DIR, "schedule.json")
    try:
        # Lade bestehende Daten
        if os.path.exists(schedule_path):
            with open(schedule_path, "r") as f:
                data = json.load(f)
        else:
            data = {}

        # Baue neuen Eintrag
        if req.once and req.date and req.time:
            dt = f"{req.date}T{req.time}:00"
            data[req.workflow] = {
                "type": "once",
                "datetime": dt
            }
        elif req.cron:
            data[req.workflow] = {
                "type": "cron",
                "cron": req.cron
            }
        else:
            return {"status": "error", "message": "Invalid schedule data"}

        # Speichere zurück
        with open(schedule_path, "w") as f:
            json.dump(data, f, indent=2)

        return {"status": "success", "message": "Schedule saved"}

    except Exception as e:
        return {"status": "error", "message": str(e)}

# ✅ Healthcheck
@app.get("/status/status")
def status_check():
    return {"status": "ok"}