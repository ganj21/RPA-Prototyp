import json
import sys
from pathlib import Path

# Workflowname aus Argument
workflow_name = sys.argv[1] if len(sys.argv) > 1 else "workflow"

# Pfade
base_dir = Path(__file__).parent.parent
workflow_path = base_dir / "artifacts" / f"{workflow_name}.json"
output_path = base_dir / "artifacts" / "generated.robot"

# Workflow laden
with open(workflow_path, "r") as f:
    workflow = json.load(f)

nodes = {node["id"]: node for node in workflow["nodes"]}
edges = workflow["edges"]

def get_ordered_nodes(nodes, edges):
    incoming = {node_id: 0 for node_id in nodes}
    for edge in edges:
        incoming[edge["target"]] += 1

    ordered = []
    queue = [nid for nid, count in incoming.items() if count == 0]

    while queue:
        current = queue.pop(0)
        ordered.append(nodes[current])
        for edge in edges:
            if edge["source"] == current:
                incoming[edge["target"]] -= 1
                if incoming[edge["target"]] == 0:
                    queue.append(edge["target"])
    return ordered

ordered_nodes = get_ordered_nodes(nodes, edges)

robot_lines = [
    "*** Settings ***",
    "Library    SeleniumLibrary",
    "",
    "*** Test Cases ***",
    "Generated Workflow",
    "    Open Browser    about:blank    Chrome",
]

for node in ordered_nodes:
    ntype = node.get("type", "").lower()
    data = node.get("data", {})

    if ntype == "navigate":
        robot_lines.append(f"    Go To    {data.get('url', '')}")

    elif ntype == "click":
        selector = data.get("selector", "")
        robot_lines.append(f"    Wait Until Page Contains Element    {selector}    timeout=10s")
        robot_lines.append(f"    Click Element    {selector}")

    elif ntype == "input":
        selector = data.get("selector", "")
        value = data.get("inputText", "")
        robot_lines.append(f"    Wait Until Element Is Visible    {selector}    timeout=5s")
        robot_lines.append(f"    Input Text    {selector}    {value}")

    elif ntype == "parse":
        selector = data.get("selector", "")
        attribute = data.get("attribute", "text")
        varname = data.get("variableName", "parsed_value")

        if attribute == "text":
            robot_lines.append(f"    @{varname}=    Get Texts    {selector}")
        else:
            robot_lines.append(f"    @{varname}=    Get Element Attributes    {selector}    {attribute}")

    elif ntype == "store":
        filename = data.get("filename", "output.txt")
        varname = data.get("variableName", "parsed_value")
        robot_lines.append(f"    Append List To File    {filename}    ${{{varname}}}")

    else:
        robot_lines.append(f"    # Unsupported node type: {ntype}")

robot_lines.append("    Close Browser")

with open(output_path, "w") as f:
    f.write("\n".join(robot_lines))

print(f"Robot file generated: {output_path.resolve()}")