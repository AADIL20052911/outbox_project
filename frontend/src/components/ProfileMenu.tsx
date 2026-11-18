import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { LogOut, ChevronDown } from 'lucide-react';

export interface ProfileMenuProps {
  user: User;
  onLogout: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarSrc = user.avatar || user.avatarUrl;
  const userInitial = user.name ? user.name[0].toUpperCase() : 'U';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-smooth"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={user.name}
            className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-accent-light text-accent font-bold text-xs flex items-center justify-center border border-accent/20 shrink-0">
            {userInitial}
          </div>
        )}
        <div className="hidden sm:flex flex-col text-left min-w-0">
          <span className="text-xs font-semibold text-text-primary leading-tight truncate">{user.name}</span>
          <span className="text-[10px] text-text-secondary truncate">{user.email}</span>
        </div>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-surface border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in z-50">
          {/* Menu Header */}
          <div className="px-4 py-3 border-b border-border bg-surface-elevated">
            <div className="flex items-center gap-3">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent-light text-accent font-bold flex items-center justify-center border border-accent/20">
                  {userInitial}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-text-primary truncate">{user.name}</span>
                <span className="text-xs text-text-secondary truncate">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-danger hover:bg-danger-light rounded-lg transition-smooth text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
