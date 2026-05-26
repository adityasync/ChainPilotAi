import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <Sidebar />

      {/* Main content area - offset for sidebar */}
      <div className="pl-16 min-h-screen">
        <TopBar />

        {/* Page content */}
        <main className="px-8 pb-16 max-w-[1200px] mx-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;