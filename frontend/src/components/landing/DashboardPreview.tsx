import { useEffect, useRef, useState } from 'react';
import { Package, ShieldCheck, AlertTriangle, Users, TrendingUp, ArrowRight } from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';

const demandData = [
  { label: 'Jan', quantity: 120 },
  { label: 'Feb', quantity: 145 },
  { label: 'Mar', quantity: 165 },
  { label: 'Apr', quantity: 150 },
  { label: 'May', quantity: 190 },
  { label: 'Jun', quantity: 210 },
];

const pieData = [
  { name: 'Healthy', value: 12, color: '#30d158' },
  { name: 'Low Stock', value: 3, color: '#ff9f0a' },
  { name: 'Critical', value: 2, color: '#ff453a' },
  { name: 'Overstock', value: 2, color: '#0a84ff' },
];

const insights = [
  { sev: '#ff453a', title: 'Stockout Risk', desc: 'Widget Pro below reorder threshold' },
  { sev: '#ff9f0a', title: 'Supplier Delay', desc: 'Acme Corp 72% delay probability' },
  { sev: '#0a84ff', title: 'Demand Spike', desc: 'Forecast +34% next quarter' },
];

const DashboardPreview = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="dashboard" ref={ref} className="py-[var(--space-section)] px-6 bg-black overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-white leading-[1.05] mb-4 transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            The Dashboard.
          </h2>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-white/40 font-light max-w-[500px] mx-auto transition-all duration-700 ease-out delay-100 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Everything in one view. KPIs, charts, insights, and an AI assistant.
          </p>
        </div>

        {/* Dashboard mockup */}
        <div
          className={`transition-all duration-[1200ms] ease-out delay-[200ms] ${
            visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.96]'
          }`}
        >
          <div className="relative rounded-[20px] overflow-hidden border border-white/[0.06] shadow-[0_0_100px_-20px_rgba(10,132,255,0.15)]">
            {/* Browser chrome */}
            <div className="bg-[#111] px-4 py-3 flex items-center gap-3 border-b border-white/[0.04]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-[#2c2c2e] rounded-md px-4 py-1 text-[11px] text-[#6e6e73] font-medium">
                  dashboard.chainpilot.app
                </div>
              </div>
              <div className="w-12" />
            </div>

            {/* Dashboard body */}
            <div className="bg-[#1c1c1e] flex">
              {/* Sidebar */}
              <div className="hidden md:block w-44 bg-[#111] p-4 flex-shrink-0 border-r border-white/[0.04]">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-[#0a84ff]/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-[#0a84ff]" />
                  </div>
                  <span className="text-[13px] font-semibold text-white">ChainPilot</span>
                </div>
                <div className="space-y-1">
                  {['Dashboard', 'Inventory', 'Demand', 'Suppliers', 'Insights'].map(
                    (item, i) => (
                      <div
                        key={item}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] ${
                          i === 0
                            ? 'bg-white/[0.08] text-white font-medium'
                            : 'text-white/30 hover:text-white/50'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-sm ${
                            i === 0 ? 'bg-[#0a84ff]' : 'bg-white/10'
                          }`}
                        />
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 p-4 md:p-5 space-y-4 min-w-0">
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { icon: Package, label: 'Products', value: '142', color: '#0a84ff' },
                    { icon: ShieldCheck, label: 'Health', value: '78%', color: '#30d158' },
                    { icon: AlertTriangle, label: 'Risks', value: '7', color: '#ff9f0a' },
                    { icon: Users, label: 'Suppliers', value: '3', color: '#ff453a' },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="bg-[#2c2c2e] rounded-xl p-4 border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                        <span className="text-[10px] text-white/30">{kpi.label}</span>
                      </div>
                      <div className="text-[20px] font-semibold text-white">{kpi.value}</div>
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Demand chart */}
                  <div className="lg:col-span-2 bg-[#2c2c2e] rounded-xl p-4 border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[12px] font-medium text-white">Demand Trend</div>
                      <TrendingUp className="w-4 h-4 text-[#0a84ff]" />
                    </div>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={demandData}>
                          <defs>
                            <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: '#6e6e73', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis hide />
                          <Area
                            type="monotone"
                            dataKey="quantity"
                            stroke="#0a84ff"
                            strokeWidth={2}
                            fill="url(#dGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie chart */}
                  <div className="bg-[#2c2c2e] rounded-xl p-4 border border-white/[0.04]">
                    <div className="text-[12px] font-medium text-white mb-3">Inventory</div>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={44}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="text-[9px] text-white/30">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Top products */}
                  <div className="bg-[#2c2c2e] rounded-xl p-4 border border-white/[0.04]">
                    <div className="text-[12px] font-medium text-white mb-3">Top Products</div>
                    <div className="space-y-2.5">
                      {[
                        { name: 'Widget Pro', qty: '1.2k', status: '#30d158' },
                        { name: 'Gadget X', qty: '890', status: '#ff9f0a' },
                        { name: 'Part C', qty: '720', status: '#30d158' },
                        { name: 'Module B', qty: '650', status: '#ff453a' },
                      ].map((p) => (
                        <div key={p.name} className="flex items-center justify-between">
                          <span className="text-[11px] text-white/70">{p.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-white/30">{p.qty}</span>
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: p.status }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="bg-[#2c2c2e] rounded-xl p-4 border border-white/[0.04]">
                    <div className="text-[12px] font-medium text-white mb-3">Priority Insights</div>
                    <div className="space-y-3">
                      {insights.map((ins, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0"
                            style={{ backgroundColor: ins.sev }}
                          />
                          <div>
                            <div className="text-[11px] font-medium text-white/80">
                              {ins.title}
                            </div>
                            <div className="text-[10px] text-white/30">{ins.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suppliers */}
                  <div className="bg-[#2c2c2e] rounded-xl p-4 border border-white/[0.04]">
                    <div className="text-[12px] font-medium text-white mb-3">Supplier Health</div>
                    <div className="space-y-3">
                      {[
                        { label: 'Total', value: '12', color: 'text-white' },
                        { label: 'At Risk', value: '3', color: 'text-[#ff453a]' },
                        { label: 'Reliability', value: '87%', color: 'text-[#30d158]' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="text-[11px] text-white/30">{item.label}</span>
                          <span className={`text-[13px] font-medium ${item.color}`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI chat bar */}
                <div className="bg-[#2c2c2e] rounded-full px-4 py-3 flex items-center gap-3 border border-white/[0.04]">
                  <div className="w-6 h-6 rounded-full bg-[#0a84ff]/10 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-[#0a84ff]">AI</span>
                  </div>
                  <span className="text-[12px] text-white/30 flex-1">
                    Ask anything about your supply chain...
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature callouts below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
          {[
            {
              icon: TrendingUp,
              title: 'Real-time KPIs',
              desc: 'Stockout risk, overstock counts, supplier risk — updated on every load.',
              color: '#0a84ff',
            },
            {
              icon: Package,
              title: 'Interactive Charts',
              desc: 'Demand trends, inventory breakdowns, and forecast accuracy at a glance.',
              color: '#30d158',
            },
            {
              icon: ShieldCheck,
              title: 'Actionable Insights',
              desc: 'Top products, reorder alerts, and supplier health in one unified view.',
              color: '#ff9f0a',
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className={`text-center p-7 rounded-[20px] border border-white/[0.06] bg-white/[0.02] transition-all duration-700 ease-out hover:bg-white/[0.04] hover:border-white/[0.1] ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${600 + i * 80}ms` }}
            >
              <div
                className="inline-flex p-3 rounded-xl mb-4"
                style={{ backgroundColor: `${item.color}10` }}
              >
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-[13px] text-white/40 leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
