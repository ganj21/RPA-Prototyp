import { Handle, Position } from 'reactflow';

export interface CustomNodeData {
    label: string;
    url?: string;
    selector?: string;
    inputText?: string;
    attribute?: string;
    variableName?: string;
    filename?: string;
    nodeType?: string;
    onChange: (id: string, name: string, value: string) => void;
}


export default function CustomNode({ data, id }: { data: CustomNodeData; id: string }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.onChange(id, e.target.name, e.target.value);
  };

  return (
    <div style={{ padding: 10, border: '1px solid #ccc', borderRadius: 5 }}>
      <strong>{data.label}</strong><br />

      {data.label === 'Navigate Node' && (
        <input
          name="url"
          placeholder="URL"
          value={data.url || ''}
          onChange={handleChange}
        />
      )}

      {data.label === 'Click Node' && (
        <input
          name="selector"
          placeholder="CSS Selector"
          value={data.selector || ''}
          onChange={handleChange}
        />
      )}


        {data.label === 'Input Node' && (
        <>
            <input
            name="selector"
            placeholder="CSS Selector"
            value={data.selector || ''}
            onChange={handleChange}
            />
            <input
            name="inputText"
            placeholder="Text to input"
            value={data.inputText || ''}
            onChange={handleChange}
            />
        </>
        )}

        {data.label === 'Parse Node' && (
        <>
            <input
            name="selector"
            placeholder="CSS Selector"
            value={data.selector || ''}
            onChange={handleChange}
            />
            <input
            name="attribute"
            placeholder="Attribut (z. B. href, text)"
            value={data.attribute || ''}
            onChange={handleChange}
            />
            <input
            name="variableName"
            placeholder="Variablenname"
            value={data.variableName || ''}
            onChange={handleChange}
            />
        </>
        )}

        {data.label === 'Store Node' && (
        <>
            <input
            name="filename"
            placeholder="Dateiname (z.B. data.txt)"
            value={data.filename || ''}
            onChange={handleChange}
            />
            <input
            name="variableName"
            placeholder="Variable (z.B. parsed_value)"
            value={data.variableName || ''}
            onChange={handleChange}
            />
        </>
        )}

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
