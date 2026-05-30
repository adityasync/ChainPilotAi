const AIChat = () => {
  return (
    <svg
      viewBox="0 0 380 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      {/* Chat container */}
      <rect width="380" height="340" rx="16" fill="#ffffff" stroke="#e5e5e7" strokeWidth="1" />

      {/* Header */}
      <rect width="380" height="48" rx="16" fill="#f5f5f7" />
      <rect x="0" y="32" width="380" height="16" fill="#f5f5f7" />
      <circle cx="28" cy="24" r="10" fill="#0071e3" opacity="0.15" />
      <text x="28" y="28" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0071e3">
        AI
      </text>
      <text x="46" y="28" fontSize="12" fontWeight="600" fill="#1d1d1f">
        Supply Chain Assistant
      </text>
      <circle cx="352" cy="24" r="4" fill="#34c759" />

      {/* User message */}
      <g transform="translate(200, 68)">
        <rect x="0" y="0" width="164" height="36" rx="18" fill="#0071e3" />
        <text x="82" y="22" textAnchor="middle" fontSize="12" fill="#ffffff">
          Which products are at risk?
        </text>
      </g>

      {/* AI response */}
      <g transform="translate(16, 120)">
        <rect width="348" height="180" rx="14" fill="#f5f5f7" />
        <text x="16" y="24" fontSize="11" fontWeight="600" fill="#1d1d1f">
          Based on current inventory data, I found 3 products at risk:
        </text>

        {/* Risk items */}
        {[
          { id: '#2847', name: 'Widget Pro', risk: 'CRITICAL', color: '#ff3b30', stock: '12 units', reorder: '50' },
          { id: '#1923', name: 'Gadget X', risk: 'RISK', color: '#ff9f0a', stock: '28 units', reorder: '40' },
          { id: '#3021', name: 'Component A', risk: 'RISK', color: '#ff9f0a', stock: '45 units', reorder: '60' },
        ].map((item, i) => (
          <g key={i} transform={`translate(12, ${44 + i * 44})`}>
            <rect width="320" height="36" rx="8" fill="#ffffff" />
            <rect x="8" y="10" width="6" height="16" rx="3" fill={item.color} />
            <text x="24" y="18" fontSize="10" fontWeight="600" fill="#1d1d1f">
              {item.name} {item.id}
            </text>
            <text x="24" y="30" fontSize="9" fill="#86868b">
              Stock: {item.stock} · Reorder at: {item.reorder}
            </text>
            <rect x="250" y="8" width="56" height="20" rx="10" fill={item.color} opacity="0.1" />
            <text x="278" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill={item.color}>
              {item.risk}
            </text>
          </g>
        ))}
      </g>

      {/* Typing indicator */}
      <g transform="translate(16, 312)">
        <circle cx="8" cy="8" r="3" fill="#86868b" opacity="0.4">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="22" cy="8" r="3" fill="#86868b" opacity="0.4">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="36" cy="8" r="3" fill="#86868b" opacity="0.4">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
};

export default AIChat;
