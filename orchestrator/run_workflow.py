import subprocess
from pathlib import Path
from prefect import flow, task
import json
from datetime import datetime

# Status-Datei aktualisieren
def update_status(name: str, status: str):
    status_path = Path(f"../artifacts/status_{name}.json")
    with open(status_path, "w") as f:
        json.dump({
            "status": status,
            "last_updated": datetime.now().isoformat()
        }, f, indent=2)

# Robot-Datei generieren (aus .json-Workflow)
@task
def generate_robot_file(name: str):
    script_path = Path(__file__).parent / "generate_robot_file.py"
    subprocess.run(
        ["python", str(script_path), name],
        check=True
    )

# Robot-Framework-Test ausführen
@task
def execute_robot():
    output_path = Path("../artifacts/generated.robot")
    robot_path = Path(__file__).parent / "venv" / "bin" / "robot"

    result = subprocess.run(
        [str(robot_path), "-d", str(output_path.parent), str(output_path)],
        capture_output=True,
        text=True
    )
    print("=== Robot Output ===")
    print(result.stdout)
    print(result.stderr)

# Prefect-Flow: alles zusammen ausführen
@flow
def run_rpa_workflow(workflow_name: str = "default"):
    update_status(workflow_name, "running")
    try:
        gen = generate_robot_file.submit(workflow_name)
        exe = execute_robot.submit(wait_for=[gen])
        exe.result()  # Blockieren, bis Robot ausgeführt wurde
        update_status(workflow_name, "completed")
    except Exception as e:
        update_status(workflow_name, "failed")
        raise e

# Lokaler Start (z.B. per subprocess oder CLI)
if __name__ == "__main__":
    import sys
    name = sys.argv[1] if len(sys.argv) > 1 else "default"
    run_rpa_workflow(name)