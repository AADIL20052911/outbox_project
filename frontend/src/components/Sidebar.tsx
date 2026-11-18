import React from 'react';
import { User, SlackIntegrationState } from '../types';
import { CalendarClock, Send, Slack, ChevronRight } from 'lucide-react';

export interface SidebarProps {
  activeTab: 'scheduled' | 'sent';
  onSelectTab: (tab: 'scheduled' | 'sent') => void;
  slackState: SlackIntegrationState;
  onOpenSlackDrawer: () => void;
  user: User;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  scheduledCount?: number;
  sentCount?: number;
}

const NavItem: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
}> = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center justify-between gap-2.5
      px-3 py-2.5
      text-sm font-medium
      rounded-lg transition-smooth
      ${active 
        ? 'bg-accent/10 text-accent border border-accent/20' 
        : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
      }
    `}
  >
    <div className="flex items-center gap-2.5">
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </div>
    {count !== undefined && (
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
        active 
          ? 'bg-accent/20 text-accent' 
          : 'bg-surface-muted text-text-secondary'
      }`}>
        {count}
      </span>
    )}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  slackState,
  onOpenSlackDrawer,
  user,
  onLogout,
  scheduledCount,
  sentCount,
}) => {
  return (
    <aside className="w-[240px] shrink-0 bg-surface border-r border-border flex flex-col h-screen sticky top-0 z-30">
      {/* Header */}
      <div className="h-16 px-5 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm">
          R
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-text-primary">ReachInbox</span>
          <span className="text-[10px] text-text-secondary font-mono uppercase tracking-wider">
            Email Ops
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex flex-col gap-1">
        <NavItem
          active={activeTab === 'scheduled'}
          onClick={() => onSelectTab('scheduled')}
          icon={CalendarClock}
          label="Scheduled"
          count={scheduledCount}
        />
        <NavItem
          active={activeTab === 'sent'}
          onClick={() => onSelectTab('sent')}
          icon={Send}
          label="Sent"
          count={sentCount}
        />
      </nav>

      {/* Slack Integration - Now the only bottom section */}
      <div className="p-4 border-t border-border mt-auto">
        <button
          onClick={onOpenSlackDrawer}
          className="w-full p-3 bg-surface-muted hover:bg-border border border-border rounded-lg transition-smooth flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#4A154B] text-white flex items-center justify-center shrink-0">
              <Slack className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-smooth">
                Slack Alerts
              </span>
              <span className="text-xs text-text-secondary flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${slackState.isConnected ? 'bg-success' : 'bg-text-tertiary'}`} />
                {slackState.isConnected ? 'Connected' : 'Disabled'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-secondary group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>
    </aside>
  );
};
