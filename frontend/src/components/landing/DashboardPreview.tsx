import { useEffect, useRef, useState } from 'react';
import {
  Package, ShieldCheck, AlertTriangle, Users,
  TrendingUp, ArrowRight, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, ResponsiveContainer,
} from 'recharts';

const demandData = [
  { label: 'Jan', quantity: 120 }, { label: 'Feb', quantity: 145 },
  { label: 'Mar', quantity: 165 }, { label: 'Apr', quantity: 150 },
  { label: 'May', quantity: 190 }, { label: 'Jun', quantity: 210 },
];

const pieData = [
  { name: 'Healthy', value: 12, color: '#34c759' },
  { name: 'Low Stock', value: 3, color: '#ff9f0a' },
  { name: 'Critical', value: 2, color: '#ff3b30' },
  { name: 'Overstock', value: 2, color: '#0071e3' },
];

const topProducts = [
  { name: 'Widget Pro', qty: '1.2k', status: '#34c759' },
  { name: 'Gadget X', qty: '890', status: '#ff9f0a' },
  { name: 'Part C', qty: '720', status: '#34c759' },
  { name: 'Module B', qty: '650', status: '#ff3b30' },
];

const insights = [
  { sev: '#ff3b30', title: 'Stockout Risk', desc: 'Widget Pro below reorder threshold' },
  { sev: '#ff9f0a', title: 'Supplier Delay', desc: 'Acme Corp 72% delay probability' },
  { sev: '#0071e3', title: 'Demand Spike', desc: 'Forecast +34% next quarter' },
];

const DashboardPreview = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-[var(--space-section)] px-6 bg-[#1d1d1f] dark:bg-[#0a0a0a] overflow-hidden">
      <div className="max-w-[980px] mx-auto">
        <div className="text-center mb-14">
          <span className={`inline-block text-[11px] font-semibold tracking-[0.12em] uppercase text-[#0a84ff] mb-3 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            The Dashboard
          </span>
          <h2 className={`text-[clamp(30px,5vw,48px)] font-semibold tracking-[-0.03em] text-white mb-4 transition-all duration-700 ease-out delay-75 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            Everything in one view.
          </h2>
          <p className={`text-[16px] text-[#a1a1a6] max-w-md mx-auto transition-all duration-700 ease-out delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            KPIs, charts, insights, and an AI assistant — on a single screen.
          </p>
        </div>

        <div className={`transition-all duration-[1200ms] ease-out delay-[300ms] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-[0.97]'}`}>
          <div className="relative rounded-[16px] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_80px_-20px_rgba(0,0,0,0.6)]">
            {/* Title bar */}
            <div className="bg-[#111] px-4 py-2.5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-[#2c2c2e] rounded-md px-4 py-1 text-[11px] text-[#6e6e73]">
                  dashboard.flowchain.app
                </div>
              </div>
              <div className="w-12" />
            </div>

            <div className="bg-[#1c1c1e] flex">
              {/* Sidebar */}
              <div className="hidden md:block w-40 bg-[#111] p-3.5 flex-shrink-0 border-r border-white/[0.04]">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-[#0071e3]/10 flex items-center justify-center">
                    <Package className="w-3.5 h-3.5 text-[#0071e3]" />
                  </div>
                  <span className="text-[12px] font-semibold text-white">FlowChain</span>
                </div>
                <div className="space-y-0.5">
                  {['Dashboard', 'Inventory', 'Demand', 'Suppliers', 'Insights'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] ${i === 0 ? 'bg-[#2c2c2e] text-white font-medium' : 'text-[#6e6e73]'}`}>
                      <div className={`w-3 h-3 rounded ${i === 0 ? 'bg-[#0071e3]/60' : 'bg-[#6e6e73]/20'}`} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main */}
              <div className="flex-1 p-3.5 md:p-4 space-y-3 min-w-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    { icon: Package, label: 'Products', value: '142', color: '#0071e3' },
                    { icon: ShieldCheck, label: 'Health', value: '78%', color: '#34c759' },
                    { icon: AlertTriangle, label: 'Risks', value: '7', color: '#ff9f0a' },
                    { icon: Users, label: 'Suppliers', value: '3', color: '#ff3b30' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-[#2c2c2e] rounded-lg p-3 border border-white/[0.04]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <kpi.icon className="w-3 h-3" style={{ color: kpi.color }} />
                        <span className="text-[9px] text-[#6e6e73]">{kpi.label}</span>
                      </div>
                      <div className="text-lg font-semibold text-white">{kpi.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                  <div className="lg:col-span-2 bg-[#2c2c2e] rounded-lg p-3 border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-medium text-white">Demand Trend</div>
                      <TrendingUp className="w-3.5 h-3.5 text-[#0071e3]" />
                    </div>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={demandData}>
                          <defs>
                            <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0071e3" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#0071e3" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#38383a" />
                          <XAxis dataKey="label" tick={{ fill: '#6e6e73', fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Area type="monotone" dataKey="quantity" stroke="#0071e3" strokeWidth={1.5} fill="url(#dGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#2c2c2e] rounded-lg p-3 border border-white/[0.04]">
                    <div className="text-[11px] font-medium text-white mb-2">Inventory</div>
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={24} outerRadius={38} paddingAngle={3} dataKey="value">
                            {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-1.5">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[8px] text-[#6e6e73]">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                  <div className="bg-[#2c2c2e] rounded-lg p-3 border border-white/[0.04]">
                    <div className="text-[11px] font-medium text-white mb-2">Top Products</div>
                    <div className="space-y-2">
                      {topProducts.map((p) => (
                        <div key={p.name} className="flex items-center justify-between">
                          <span className="text-[10px] text-white/80">{p.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#6e6e73]">{p.qty}</span>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.status }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#2c2c2e] rounded-lg p-3 border border-white/[0.04]">
                    <div className="text-[11px] font-medium text-white mb-2">Insights</div>
                    <div className="space-y-2">
                      {insights.map((ins, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full mt-[4px] flex-shrink-0" style={{ backgroundColor: ins.sev }} />
                          <div>
                            <div className="text-[10px] font-medium text-white/90">{ins.title}</div>
                            <div className="text-[9px] text-[#6e6e73]">{ins.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#2c2c2e] rounded-lg p-3 border border-white/[0.04]">
                    <div className="text-[11px] font-medium text-white mb-2">Suppliers</div>
                    <div className="space-y-2">
                      {[
                        { label: 'Total', value: '12', color: 'text-white' },
                        { label: 'At Risk', value: '3', color: 'text-[#ff3b30]' },
                        { label: 'Reliability', value: '87%', color: 'text-[#34c759]' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="text-[10px] text-[#6e6e73]">{item.label}</span>
                          <span className={`text-[12px] font-medium ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#2c2c2e] rounded-full px-3.5 py-2 flex items-center gap-2.5 border border-white/[0.04]">
                  <div className="w-5 h-5 rounded-full bg-[#0071e3]/10 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-[#0071e3]">AI</span>
                  </div>
                  <span className="text-[11px] text-[#6e6e73] flex-1">Ask anything about your supply chain...</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6e6e73]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature callouts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
          {[
            { icon: TrendingUp, title: 'Real-time KPIs', desc: 'Stockout risk, overstock counts, supplier risk — updated on every load.', color: '#0071e3' },
            { icon: Package, title: 'Interactive Charts', desc: 'Demand trends, inventory breakdowns, and forecast accuracy.', color: '#34c759' },
            { icon: Clock, title: 'Actionable Tables', desc: 'Top products, reorder alerts, and supplier health in one view.', color: '#ff9f0a' },
          ].map((item, i) => (
            <div
              key={item.title}
              className={`text-center p-6 rounded-[16px] bg-white/[0.03] border border-white/[0.04] transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: `${500 + i * 80}ms` }}
            >
              <div className="inline-flex p-2 rounded-lg bg-white/[0.06] mb-3">
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <h3 className="text-[14px] font-semibold text-white mb-1.5">{item.title}</h3>
              <p className="text-[13px] text-[#a1a1a6] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
