import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Truck,
  Lightbulb,
  Settings,
  Upload,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/demand-planning', icon: TrendingUp, label: 'Demand' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers' },
  { to: '/insights', icon: Lightbulb, label: 'Insights' },
  { to: '/upload-data', icon: Upload, label: 'Upload Data' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  return (
    <nav className="
      sidebar-nav fixed left-0 top-0 h-screen
      bg-white dark:bg-[#1c1c1e]
      border-r border-gray-100 dark:border-[#38383a]
      flex flex-col py-6 z-50
      overflow-hidden
    ">
      {/* Logo */}
      <div className="px-4 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1d1d1f] dark:bg-white flex items-center justify-center flex-shrink-0">
          <span className="text-white dark:text-black font-bold text-sm">S</span>
        </div>
        <span className="nav-label text-lg font-semibold text-[#1d1d1f] dark:text-white whitespace-nowrap">
          Supply
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl
              transition-all duration-200
              ${isActive
                ? 'bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e]'
              }
            `}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="nav-label text-sm font-medium whitespace-nowrap">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;