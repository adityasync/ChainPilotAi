const InventoryView = () => {
  const items = [
    { name: 'Widget Pro', stock: 12, max: 100, reorder: 50, status: 'critical' },
    { name: 'Gadget X', stock: 28, max: 80, reorder: 40, status: 'risk' },
    { name: 'Component A', stock: 65, max: 100, reorder: 30, status: 'healthy' },
    { name: 'Module B', stock: 92, max: 100, reorder: 20, status: 'overstock' },
    { name: 'Part C', stock: 45, max: 100, reorder: 40, status: 'healthy' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#ff3b30';
      case 'risk': return '#ff9f0a';
      case 'overstock': return '#5856d6';
      default: return '#34c759';
    }
  };

  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      {/* Container */}
      <rect width="400" height="300" rx="12" fill="#ffffff" stroke="#e5e5e7" strokeWidth="1" />

      {/* Header */}
      <text x="20" y="32" fontSize="13" fontWeight="600" fill="#1d1d1f">
        Inventory Risk Overview
      </text>

      {/* Legend */}
      <g transform="translate(240, 16)">
        {[
          { label: 'Healthy', color: '#34c759' },
          { label: 'Risk', color: '#ff9f0a' },
          { label: 'Critical', color: '#ff3b30' },
        ].map((item, i) => (
          <g key={item.label} transform={`translate(${i * 56}, 0)`}>
            <circle cx="4" cy="8" r="3" fill={item.color} />
            <text x="12" y="12" fontSize="8" fill="#86868b">{item.label}</text>
          </g>
        ))}
      </g>

      {/* Stock bars */}
      {items.map((item, i) => {
        const y = 56 + i * 48;
        const barWidth = 280;
        const stockPercent = item.stock / item.max;
        const reorderPercent = item.reorder / item.max;
        const color = getStatusColor(item.status);

        return (
          <g key={item.name}>
            {/* Name */}
            <text x="20" y={y + 8} fontSize="11" fontWeight="500" fill="#1d1d1f">
              {item.name}
            </text>

            {/* Bar background */}
            <rect x="20" y={y + 16} width={barWidth} height="12" rx="6" fill="#f5f5f7" />

            {/* Stock fill */}
            <rect
              x="20"
              y={y + 16}
              width={barWidth * stockPercent}
              height="12"
              rx="6"
              fill={color}
              opacity="0.8"
            />

            {/* Reorder line */}
            <line
              x1={20 + barWidth * reorderPercent}
              y1={y + 14}
              x2={20 + barWidth * reorderPercent}
              y2={y + 30}
              stroke="#1d1d1f"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              opacity="0.4"
            />

            {/* Values */}
            <text x="310" y={y + 8} fontSize="10" fill="#86868b">
              {item.stock}/{item.max}
            </text>

            {/* Status badge */}
            <rect x="348" y={y + 2} width="36" height="16" rx="8" fill={color} opacity="0.1" />
            <text x="366" y={y + 14} textAnchor="middle" fontSize="7" fontWeight="700" fill={color}>
              {item.status.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default InventoryView;
