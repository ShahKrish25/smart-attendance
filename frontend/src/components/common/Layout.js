import React, { useState } from 'react';
import Navbar from './Layouts/Navbar';
import Sidebar from './Layouts/Sidebar';

const Layout = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {typeof children === 'function' ? children(activeTab, setActiveTab) : children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
