const MLPipeline = () => {
  const models = [
    { name: 'Demand Forecast', accuracy: '94%', color: '#0071e3', bg: '#f0f7ff' },
    { name: 'Inventory Risk', accuracy: '91%', color: '#34c759', bg: '#f0fdf4' },
    { name: 'Supplier Delay', accuracy: '89%', color: '#ff9f0a', bg: '#fff8ee' },
    { name: 'Cost Anomaly', accuracy: '96%', color: '#ff3b30', bg: '#fff4f4' },
  ];

  const cx = 200, cy = 155;
  const dist = 115;
  const positions = [
    { x: cx, y: cy - dist },     // top
    { x: cx + dist + 10, y: cy },     // right
    { x: cx, y: cy + dist },     // bottom
    { x: cx - dist - 10, y: cy },     // left
  ];

  const cardW = 110;
  const cardH = 52;

  return (
    <svg
      viewBox="0 0 420 310"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      {/* Connection lines */}
      {positions.map((pos, i) => (
        <line
          key={`line-${i}`}
          x1={cx}
          y1={cy}
          x2={pos.x}
          y2={pos.y}
          stroke={models[i].color}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.3"
        />
      ))}

      {/* Central hub */}
      <circle cx={cx} cy={cy} r="34" fill="#f5f5f7" stroke="#e5e5e7" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="24" fill="#ffffff" stroke="#e5e5e7" strokeWidth="1" />
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1d1d1f">
        ML
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fontWeight="500" fill="#86868b">
        Engine
      </text>

      {/* Model cards */}
      {models.map((model, i) => {
        const pos = positions[i];
        const left = pos.x - cardW / 2;
        const top = pos.y - cardH / 2;
        const iconX = left + 18;
        const textX = left + 46;
        const barY = top + cardH - 14;
        const barW = cardW - 32;

        return (
          <g key={i}>
            {/* Card */}
            <rect x={left} y={top} width={cardW} height={cardH} rx="10" fill={model.bg} stroke={model.color} strokeWidth="1" />

            {/* Colored dot — vertically centered */}
            <circle cx={iconX} cy={pos.y} r="6" fill={model.color} opacity="0.2" />
            <circle cx={iconX} cy={pos.y} r="3" fill={model.color} />

            {/* Name — single line, vertically centered, right of dot */}
            <text x={textX + 18} y={pos.y + 1} textAnchor="middle" fontSize="9" fontWeight="600" fill="#1d1d1f" dominantBaseline="central">
              {model.name}
            </text>

            {/* Accuracy bar */}
            <rect x={left + 8} y={barY} width={barW} height="5" rx="2.5" fill="#e5e5e7" />
            <rect x={left + 8} y={barY} width={barW * (parseInt(model.accuracy) / 100)} height="5" rx="2.5" fill={model.color} />
            {/* Percentage — right of bar */}
            <text x={left + 8 + barW + 4} y={barY + 4.5} fontSize="9" fontWeight="700" fill={model.color}>
              {model.accuracy}
            </text>
          </g>
        );
      })}

      {/* Data flow arrows */}
      <g opacity="0.2">
        <path d="M 60 35 L 145 115" stroke="#86868b" strokeWidth="1" markerEnd="url(#arrow)" />
        <path d="M 360 35 L 275 115" stroke="#86868b" strokeWidth="1" markerEnd="url(#arrow)" />
        <path d="M 60 275 L 145 195" stroke="#86868b" strokeWidth="1" markerEnd="url(#arrow)" />
        <path d="M 360 275 L 275 195" stroke="#86868b" strokeWidth="1" markerEnd="url(#arrow)" />
      </g>

      {/* Input labels */}
      <text x="48" y="30" fontSize="8" fill="#86868b" textAnchor="middle">Orders</text>
      <text x="372" y="30" fontSize="8" fill="#86868b" textAnchor="middle">Inventory</text>
      <text x="48" y="290" fontSize="8" fill="#86868b" textAnchor="middle">Suppliers</text>
      <text x="372" y="290" fontSize="8" fill="#86868b" textAnchor="middle">Costs</text>

      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#86868b" />
        </marker>
      </defs>
    </svg>
  );
};

export default MLPipeline;
