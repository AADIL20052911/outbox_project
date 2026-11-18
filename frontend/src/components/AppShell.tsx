import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { User, SlackIntegrationState } from '../types';

export interface AppShellProps {
  children: React.ReactNode;
  activeTab: 'scheduled' | 'sent';
  onSelectTab: (tab: 'scheduled' | 'sent') => void;
  slackState: SlackIntegrationState;
  onOpenSlackDrawer: () => void;
  user: User;
  onLogout: () => void;
  globalSearch: string;
  onSearchChange: (val: string) => void;
  scheduledCount?: number;
  sentCount?: number;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeTab,
  onSelectTab,
  slackState,
  onOpenSlackDrawer,
  user,
  onLogout,
  globalSearch,
  onSearchChange,
  scheduledCount,
  sentCount,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const getTitle = () => {
    if (activeTab === 'scheduled') return 'Scheduled Emails';
    return 'Sent Emails';
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          slackState={slackState}
          onOpenSlackDrawer={onOpenSlackDrawer}
          user={user}
          onLogout={onLogout}
          scheduledCount={scheduledCount}
          sentCount={sentCount}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 transform transition-transform duration-200 md:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            onSelectTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          slackState={slackState}
          onOpenSlackDrawer={() => {
            onOpenSlackDrawer();
            setIsMobileSidebarOpen(false);
          }}
          user={user}
          onLogout={onLogout}
          scheduledCount={scheduledCount}
          sentCount={sentCount}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar
          pageTitle={getTitle()}
          globalSearch={globalSearch}
          onSearchChange={onSearchChange}
          user={user}
          onLogout={onLogout}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
