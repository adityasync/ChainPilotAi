import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      {children}
      <Outlet />
    </>
  );
};

export default Layout;