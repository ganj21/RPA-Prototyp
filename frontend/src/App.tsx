import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'reactflow';

import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import type { CustomNodeData } from './CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

let id = 4;
const getId = () => `${id++}`;

const initialNodes: Node<CustomNodeData>[] = [
  {
    id: '1',
    position: { x: 50, y: 50 },
    data: {
      label: 'Start Node',
      onChange: () => {},
    },
    type: 'input',
  },
  {
    id: '2',
    position: { x: 250, y: 150 },
    data: {
      label: 'Click Node',
      onChange: () => {},
    },
    type: 'custom',
  },
  {
    id: '3',
    position: { x: 450, y: 250 },
    data: {
      label: 'End Node',
      onChange: () => {},
    },
    type: 'output',
  },
];

const initialEdges: Edge[] = [];

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('my_workflow');
  const [workflows, setWorkflows] = useState<{ name: string; status: string; last_run?: string }[]>([]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onChange = (id: string, field: string, value: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                [field]: value,
              },
            }
          : node
      )
    );
  };

  const addNode = (type: string) => {
    const newNode: Node<CustomNodeData> = {
      id: getId(),
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        nodeType: type.toLowerCase(),
        onChange,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleExport = async () => {
    const exportData = {
      name: workflowName,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.nodeType,
        position: node.position,
        data: {
          label: node.data.label,
          url: node.data.url,
          selector: node.data.selector,
          inputText: node.data.inputText,
          attribute: node.data.attribute,
          variableName: node.data.variableName,
          filename: node.data.filename,
        },
      })),
      edges,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const formData = new FormData();
    formData.append('file', blob, `${workflowName}.json`);

    try {
      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      alert(`Upload successful: ${result.filename}`);
      fetchWorkflows();
    } catch (error) {
      alert('Upload failed. Check the console for details.');
      console.error(error);
    }
  };

  const handleRunWorkflow = async (workflowName: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/run/${workflowName}`, {
        method: 'POST',
      });
      const data = await res.json();
      alert(`Workflow gestartet: ${data.workflow}`);
    } catch (err) {
      console.error("Fehler beim Starten des Workflows:", err);
      alert("Start fehlgeschlagen");
    }
  };

  const handleScheduleWorkflow = async () => {
    const name = prompt("Workflow-Name?");
    const once = window.confirm("Einmalig ausführen? (OK = Ja, Abbrechen = Cron)");
    let body: any = { workflow: name };

    if (once) {
      const date = prompt("Datum (YYYY-MM-DD)?");
      const time = prompt("Uhrzeit (HH:MM)?");
      body.once = true;
      body.date = date;
      body.time = time;
    } else {
      const cron = prompt("Cron-Ausdruck (z. B. 0 9 * * 1 für Mo 9 Uhr)?");
      body.cron = cron;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      alert(data.message || "Plan gespeichert");
    } catch (err) {
      console.error("Fehler beim Speichern des Plans:", err);
      alert("Fehlgeschlagen");
    }
  };

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/workflows');
      const data = await res.json();
      const files: string[] = data.workflows;

      const statuses = await Promise.all(
        files.map(async (filename) => {
          const name = filename.replace('.json', '');
          try {
            const res = await fetch(`http://127.0.0.1:8000/status/${name}`);
            const statusData = await res.json();
            return {
              name: filename,
              status: statusData.status || 'pending',
              last_run: statusData.last_run || '',
            };
          } catch {
            return { name: filename, status: 'unknown' };
          }
        })
      );

      setWorkflows(statuses);
    } catch (err) {
      console.error("Error loading workflows:", err);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px' }}>
        <h4>Nodes</h4>
        <button onClick={() => addNode('Input')}>➕ Input</button><br />
        <button onClick={() => addNode('Parse')}>➕ Parse</button><br />
        <button onClick={() => addNode('Store')}>➕ Store</button><br />
        <button onClick={() => addNode('Click')}>➕ Click</button><br />
        <button onClick={() => addNode('Navigate')}>➕ Navigate</button><br /><br />

        <input
          type="text"
          placeholder="Workflow Name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          style={{ marginBottom: '10px', width: '90%' }}
        />
        <button onClick={handleExport}>💾 Export Workflow</button>
        <br />
        <button onClick={handleScheduleWorkflow}>📅 Zeitplan festlegen</button>

        <hr />
        <h4>📋 Gespeicherte Workflows</h4>
        <ul style={{ fontSize: '14px', paddingLeft: '10px' }}>
          {workflows.map((w) => (
            <li key={w.name}>
              📄 {w.name} — <strong>{w.status}</strong>{' '}
              <button onClick={() => handleRunWorkflow(w.name.replace('.json', ''))}>▶️ Starten</button>
            </li>
          ))}
        </ul>

        <hr />
        <h4>🕒 Letzte Ausführungen</h4>
        <ul style={{ fontSize: '13px', paddingLeft: '10px' }}>
          {[...workflows]
            .filter(w => w.last_run)
            .sort((a, b) => new Date(b.last_run!).getTime() - new Date(a.last_run!).getTime())
            .slice(0, 10)
            .map((w) => (
              <li key={w.name + w.last_run}>
                {w.name} – <strong>{w.status}</strong><br />
                <span style={{ fontSize: '11px', color: '#666' }}>
                  {new Date(w.last_run!).toLocaleString()}
                </span>
              </li>
            ))}
        </ul>
      </div>

      <div style={{ height: '100vh', width: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
