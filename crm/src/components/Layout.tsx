import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';
import LeadDetailDrawer from './LeadDetailDrawer';
import type { Lead } from '@/pages/Kanban';

const Layout = () => {
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSearchSelect = (lead: Lead) => {
    setDrawerLead(lead);
    setDrawerOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="app-container">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-sm shrink-0">
            <div /> {/* Spacer */}
            <SearchBar onSelectLead={handleSearchSelect} />
          </header>

          {/* Main Content */}
          <main className="main-content flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>

        {/* Global Lead Drawer */}
        <LeadDetailDrawer
          lead={drawerLead}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      </div>
    </TooltipProvider>
  );
};

export default Layout;
