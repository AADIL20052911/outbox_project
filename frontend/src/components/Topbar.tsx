import React from 'react';
import { User } from '../types';
import { SearchInput } from './SearchInput';
import { ThemeToggle } from './ThemeToggle';
import { ProfileMenu } from './ProfileMenu';
import { Menu } from 'lucide-react';

export interface TopbarProps {
  pageTitle: string;
  globalSearch: string;
  onSearchChange: (val: string) => void;
  user: User;
  onLogout: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  pageTitle,
  globalSearch,
  onSearchChange,
  user,
  onLogout,
  onToggleMobileSidebar,
}) => {

  return (
    <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-20 shadow-subtle">
      {/* Left Section */}
      <div className="flex items-center gap-4 min-w-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg border border-border text-text-secondary hover:bg-surface-muted transition-smooth"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-text-primary truncate">{pageTitle}</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:block w-72">
          <SearchInput
            value={globalSearch}
            onChange={onSearchChange}
            placeholder="Search emails..."
          />
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Menu */}
        <ProfileMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};
