import json
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from pathlib import Path
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess

ARTIFACTS = Path(__file__).parent.parent / "artifacts"
SCHEDULE_FILE = ARTIFACTS / "schedule.json"
scheduler = BackgroundScheduler()


def run_workflow(name):
    print(f"🚀 Triggering workflow: {name}")
    subprocess.run(["python", "../orchestrator/run_workflow.py", name])


def schedule_jobs():
    scheduler.remove_all_jobs()
    if not SCHEDULE_FILE.exists():
        return

    with open(SCHEDULE_FILE) as f:
        data = json.load(f)

    for name, job in data.items():
        if job["type"] == "cron":
            cron_expr = job["cron"]
            minute, hour, *_ = cron_expr.split(" ")
            scheduler.add_job(run_workflow, "cron", hour=hour, minute=minute, args=[name])
            print(f"⏰ Scheduled {name} with cron: {cron_expr}")

        elif job["type"] == "once":
            run_time = datetime.fromisoformat(job["datetime"])
            if run_time > datetime.now():
                scheduler.add_job(run_workflow, "date", run_date=run_time, args=[name])
                print(f"🕒 Scheduled one-time run for {name} at {run_time.isoformat()}")


# 🔁 Watchdog Handler
class ScheduleChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith("schedule.json"):
            print("🔄 Detected schedule.json change – reloading jobs...")
            schedule_jobs()


if __name__ == "__main__":
    print("📡 Starting scheduler with live reload...")
    schedule_jobs()
    scheduler.start()

    # 🔍 Setup file watcher
    event_handler = ScheduleChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, path=str(ARTIFACTS), recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        scheduler.shutdown()