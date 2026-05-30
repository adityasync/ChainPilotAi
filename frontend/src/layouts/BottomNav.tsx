import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Truck,
  Lightbulb,
  Upload,
  Settings,
  ShoppingCart,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/demand', icon: TrendingUp, label: 'Demand' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers' },
  { to: '/insights', icon: Lightbulb, label: 'Insights' },
  { to: '/upload-data', icon: Upload, label: 'Upload' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1c1c1e] border-t border-gray-100 dark:border-[#38383a] lg:hidden">
      <div className="flex items-center justify-around px-1 py-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-0 flex-shrink-0
              transition-colors duration-200
              ${isActive
                ? 'text-[#0071e3]'
                : 'text-[#86868b] dark:text-[#98989d]'
              }
            `}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
