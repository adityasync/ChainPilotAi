const DashboardMockup = () => {
  // Dark theme colors — matches the DashboardPreview section background
  const bg = '#1c1c1e';
  const card = '#2c2c2e';
  const border = '#38383a';
  const text = '#ffffff';
  const textSecondary = '#98989d';
  const accent = '#0071e3';

  return (
    <svg
      viewBox="0 0 800 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      {/* Main background */}
      <rect width="800" height="520" rx="12" fill={bg} />

      {/* Title bar */}
      <rect x="0" y="0" width="800" height="40" rx="12" fill="#111111" />
      <rect x="0" y="28" width="800" height="12" fill="#111111" />

      {/* Traffic lights */}
      <circle cx="20" cy="20" r="6" fill="#ff5f57" />
      <circle cx="40" cy="20" r="6" fill="#febc2e" />
      <circle cx="60" cy="20" r="6" fill="#28c840" />

      {/* URL bar */}
      <rect x="200" y="12" width="400" height="20" rx="10" fill={card} />
      <text x="370" y="26" textAnchor="middle" fontSize="10" fill={textSecondary}>
        dashboard.flowchain.app
      </text>

      {/* Sidebar */}
      <rect x="0" y="40" width="180" height="480" fill="#111111" />
      <rect x="16" y="56" width="32" height="32" rx="8" fill={accent} opacity="0.15" />
      <text x="56" y="76" fontSize="11" fontWeight="600" fill={text}>
        FlowChain
      </text>

      {/* Nav items */}
      {['Dashboard', 'Inventory', 'Demand', 'Suppliers', 'Insights', 'Settings'].map(
        (item, i) => (
          <g key={item}>
            <rect
              x="8"
              y={100 + i * 36}
              width="164"
              height="28"
              rx="8"
              fill={i === 0 ? card : 'transparent'}
            />
            <rect
              x="16"
              y={106 + i * 36}
              width="16"
              height="16"
              rx="4"
              fill={i === 0 ? accent : textSecondary}
              opacity={i === 0 ? 1 : 0.3}
            />
            <text
              x="40"
              y={118 + i * 36}
              fontSize="11"
              fill={i === 0 ? text : textSecondary}
              fontWeight={i === 0 ? '600' : '400'}
            >
              {item}
            </text>
          </g>
        )
      )}

      {/* Main content area */}
      <g transform="translate(196, 56)">
        {/* KPI Cards — 4 across */}
        {[
          { label: 'Total Products', value: '142', sub: 'Tracked in inventory', color: '#0071e3' },
          { label: 'Inventory Health', value: '78%', sub: '12 products healthy', color: '#34c759' },
          { label: 'Stock Risks', value: '7', sub: '2 critical, 5 low stock', color: '#ff9f0a' },
          { label: 'Suppliers at Risk', value: '3', sub: 'of 12 total', color: '#ff3b30' },
        ].map((kpi, i) => (
          <g key={kpi.label} transform={`translate(${i * 145}, 0)`}>
            <rect width="135" height="76" rx="12" fill={card} />
            <rect width="135" height="76" rx="12" stroke={border} strokeWidth="1" fill="none" />
            <circle cx="22" cy="22" r="8" fill={kpi.color} opacity="0.15" />
            <text x="36" y="26" fontSize="9" fill={textSecondary}>
              {kpi.label}
            </text>
            <text x="16" y="52" fontSize="22" fontWeight="700" fill={text}>
              {kpi.value}
            </text>
            <text x="16" y="66" fontSize="8" fill={textSecondary}>
              {kpi.sub}
            </text>
          </g>
        ))}

        {/* Demand Trend Chart */}
        <g transform="translate(0, 92)">
          <rect width="285" height="160" rx="12" fill={card} />
          <rect width="285" height="160" rx="12" stroke={border} strokeWidth="1" fill="none" />
          <text x="16" y="22" fontSize="10" fontWeight="600" fill={text}>
            Demand Trend
          </text>
          <text x="16" y="34" fontSize="8" fill={textSecondary}>
            Order volume over 6 months
          </text>

          {/* Area chart */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={accent} stopOpacity="0.2" />
              <stop offset="95%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points="30,130 70,110 110,95 150,105 190,80 230,70 260,60 260,145 30,145"
            fill="url(#areaGrad)"
          />
          <polyline
            points="30,130 70,110 110,95 150,105 190,80 230,70 260,60"
            stroke={accent}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Grid */}
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="30" y1={60 + i * 25} x2="260" y2={60 + i * 25} stroke={border} strokeWidth="1" />
          ))}
          {/* X-axis labels */}
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
            <text key={m} x={30 + i * 46} y="155" fontSize="7" fill={textSecondary} textAnchor="middle">{m}</text>
          ))}
        </g>

        {/* Inventory Donut */}
        <g transform="translate(301, 92)">
          <rect width="130" height="160" rx="12" fill={card} />
          <rect width="130" height="160" rx="12" stroke={border} strokeWidth="1" fill="none" />
          <text x="16" y="22" fontSize="10" fontWeight="600" fill={text}>
            Inventory
          </text>

          {/* Donut chart */}
          <circle cx="65" cy="80" r="35" fill="none" stroke="#34c759" strokeWidth="12" strokeDasharray="110 110" strokeDashoffset="0" />
          <circle cx="65" cy="80" r="35" fill="none" stroke="#ff9f0a" strokeWidth="12" strokeDasharray="35 185" strokeDashoffset="-110" />
          <circle cx="65" cy="80" r="35" fill="none" stroke="#ff3b30" strokeWidth="12" strokeDasharray="20 200" strokeDashoffset="-145" />
          <circle cx="65" cy="80" r="35" fill="none" stroke={accent} strokeWidth="12" strokeDasharray="20 200" strokeDashoffset="-165" />

          {/* Legend */}
          {[
            { label: 'Healthy', color: '#34c759' },
            { label: 'Low Stock', color: '#ff9f0a' },
            { label: 'Critical', color: '#ff3b30' },
            { label: 'Overstock', color: accent },
          ].map((item) => (
            <g key={item.label}>
              <circle cx="4" cy="4" r="3" fill={item.color} />
            </g>
          ))}
        </g>

        {/* Top Products Table */}
        <g transform="translate(447, 92)">
          <rect width="139" height="160" rx="12" fill={card} />
          <rect width="139" height="160" rx="12" stroke={border} strokeWidth="1" fill="none" />
          <text x="12" y="22" fontSize="10" fontWeight="600" fill={text}>
            Top Products
          </text>

          {[
            { name: 'Widget Pro', qty: '1.2k', status: '#34c759' },
            { name: 'Gadget X', qty: '890', status: '#ff9f0a' },
            { name: 'Part C', qty: '720', status: '#34c759' },
            { name: 'Module B', qty: '650', status: '#ff3b30' },
          ].map((p, i) => (
            <g key={p.name} transform={`translate(8, ${36 + i * 30})`}>
              <text x="4" y="8" fontSize="9" fill={text}>{p.name}</text>
              <text x="80" y="8" fontSize="9" fill={textSecondary} textAnchor="end">{p.qty}</text>
              <circle cx="120" cy="4" r="4" fill={p.status} opacity="0.2" />
              <circle cx="120" cy="4" r="2" fill={p.status} />
            </g>
          ))}
        </g>

        {/* Insights row */}
        <g transform="translate(0, 268)">
          <rect width="350" height="120" rx="12" fill={card} />
          <rect width="350" height="120" rx="12" stroke={border} strokeWidth="1" fill="none" />
          <text x="16" y="22" fontSize="10" fontWeight="600" fill={text}>
            Priority Insights
          </text>
          <text x="310" y="22" fontSize="8" fill={accent}>View all →</text>

          {[
            { sev: '#ff3b30', title: 'Stockout Risk', desc: 'Widget Pro below reorder threshold' },
            { sev: '#ff9f0a', title: 'Supplier Delay', desc: 'Acme Corp 72% delay probability' },
            { sev: accent, title: 'Demand Spike', desc: 'Forecast +34% next quarter' },
          ].map((insight, i) => (
            <g key={i} transform={`translate(12, ${36 + i * 28})`}>
              <circle cx="6" cy="6" r="3" fill={insight.sev} />
              <text x="18" y="4" fontSize="9" fontWeight="600" fill={text}>{insight.title}</text>
              <text x="18" y="16" fontSize="8" fill={textSecondary}>{insight.desc}</text>
            </g>
          ))}
        </g>

        {/* Supplier Health card */}
        <g transform="translate(366, 268)">
          <rect width="220" height="120" rx="12" fill={card} />
          <rect width="220" height="120" rx="12" stroke={border} strokeWidth="1" fill="none" />
          <text x="16" y="22" fontSize="10" fontWeight="600" fill={text}>
            Supplier Health
          </text>

          {[
            { label: 'Total Suppliers', value: '12', color: text },
            { label: 'At Risk', value: '3', color: '#ff3b30' },
            { label: 'Avg Reliability', value: '87%', color: '#34c759' },
          ].map((item, i) => (
            <g key={item.label} transform={`translate(16, ${40 + i * 26})`}>
              <text fontSize="9" fill={textSecondary}>{item.label}</text>
              <text x="180" fontSize="12" fontWeight="600" fill={item.color} textAnchor="end">{item.value}</text>
            </g>
          ))}
        </g>

        {/* AI Chat input */}
        <g transform="translate(0, 404)">
          <rect width="586" height="40" rx="20" fill={card} />
          <rect width="586" height="40" rx="20" stroke={border} strokeWidth="1" fill="none" />
          <circle cx="22" cy="20" r="8" fill={accent} opacity="0.2" />
          <text x="22" y="24" textAnchor="middle" fontSize="9" fill={accent} fontWeight="600">
            AI
          </text>
          <text x="40" y="24" fontSize="10" fill={textSecondary}>
            Ask anything about your supply chain...
          </text>
          <rect x="544" y="10" width="26" height="20" rx="10" fill={accent} />
          <text x="557" y="24" textAnchor="middle" fontSize="10" fill="#ffffff">
            →
          </text>
        </g>
      </g>
    </svg>
  );
};

export default DashboardMockup;
