import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#fbfbfd] dark:bg-[#0a0a0a]">
      <Sidebar />

      {/* Main content area - offset for sidebar on desktop, bottom padding for mobile nav */}
      <div className="lg:pl-16 min-h-screen pb-20 lg:pb-0">
        <TopBar />

        {/* Page content */}
        <main className="px-4 sm:px-8 pb-8 max-w-[1200px] mx-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
