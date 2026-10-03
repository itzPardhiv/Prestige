import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Settings,
  Folder,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Lock,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { UserProfile } from '../../types/user';
import { NavTab } from './SpotlightNavbar';

export interface ProfileDropdownProps {
  user: UserProfile;
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
  onOpenTerms: () => void;
  onSignOut: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onSelectTab,
  onOpenSettings,
  onOpenTerms,
  onSignOut,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const displayName = user.name || user.username || 'Learner';
  const displayEmail = user.email || (user.username ? `${user.username.toLowerCase().replace(/\s+/g, '')}@prestige.local` : 'learner@prestige.local');
  const userInitials = displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'LE';

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Precision Profile Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open learner profile menu"
        className={`
          group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-150 text-xs
          bg-surface-secondary/70 hover:bg-surface-secondary
          border border-border hover:border-border-strong
          ${isOpen ? 'ring-2 ring-brand-500/20 border-brand-500' : ''}
        `}
      >
        {/* User Info (hidden on small mobile screens) */}
        <div className="hidden sm:flex flex-col text-left leading-tight space-y-0.5">
          <span className="text-[12px] font-semibold text-content-primary truncate max-w-[130px]">
            {displayName}
          </span>
          <span className="text-[10px] text-content-tertiary font-medium truncate max-w-[130px]">
            {user.callsign}
          </span>
        </div>

        {/* Avatar with Fallback Initials */}
        <div className="relative w-6 h-6 rounded-md overflow-hidden bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold flex items-center justify-center text-[11px] shrink-0 border border-brand-500/20">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              className="w-full h-full object-cover rounded-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span>{userInitials}</span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 hidden sm:block ${
            isOpen ? 'rotate-180 text-brand-500' : 'group-hover:text-zinc-700 dark:group-hover:text-zinc-200'
          }`}
        />
      </button>

      {/* Apple Liquid UI Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="profile-dropdown"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            aria-orientation="vertical"
            style={{
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            }}
            className="
              absolute right-0 mt-2 w-72 origin-top-right rounded-2xl
              bg-white/[0.97] dark:bg-zinc-900/[0.98]
              border border-black/[0.12] dark:border-white/[0.16]
              shadow-[0_20px_45px_rgba(0,0,0,0.16),0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]
              dark:shadow-[0_24px_50px_rgba(0,0,0,0.65),0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.14)]
              py-1.5 z-50 overflow-hidden transition-colors
            "
          >
          {/* User Header Summary Card */}
          <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08] space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-500 text-white font-medium flex items-center justify-center text-sm shrink-0 ring-1 ring-black/10 dark:ring-white/20 shadow-xs">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-content-primary truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-content-secondary truncate">
                  {displayEmail}
                </p>
              </div>
            </div>

            {/* User Session Info */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-content-secondary">
              <span className="font-mono text-brand-600 dark:text-brand-400 font-medium">
                {user.callsign}
              </span>
              <span className={`font-medium ${user.role === 'ADMIN' ? 'text-amber-500 font-semibold' : 'text-content-tertiary'}`}>
                {user.role === 'ADMIN' ? 'Admin Clearance' : 'Open Workspace'}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(() => onSelectTab('profile'))}
              className="w-full px-4 py-2 text-xs text-left text-content-secondary hover:text-content-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-content-tertiary" />
              <span>Learner Profile</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(onOpenSettings)}
              className="w-full px-4 py-2 text-xs text-left text-content-secondary hover:text-content-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-content-tertiary" />
              <span>Settings & Preferences</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(() => onSelectTab('archive'))}
              className="w-full px-4 py-2 text-xs text-left text-content-secondary hover:text-content-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
            >
              <Folder className="w-3.5 h-3.5 text-content-tertiary" />
              <span>Saved Work & History</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(() => onSelectTab('reports'))}
              className="w-full px-4 py-2 text-xs text-left text-content-secondary hover:text-content-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-content-tertiary" />
              <span>Reports</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleItemClick(onOpenTerms)}
              className="w-full px-4 py-2 text-xs text-left text-content-secondary hover:text-content-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-content-tertiary" />
              <span>Terms & Policies</span>
            </button>

            {user?.role === 'ADMIN' ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => handleItemClick(() => onSelectTab('admin'))}
                className="w-full px-4 py-2 text-xs text-left text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors font-medium"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin Operations</span>
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => handleItemClick(() => onSelectTab('admin'))}
                className="w-full px-4 py-2 text-xs text-left text-content-secondary hover:text-amber-500 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-content-tertiary group-hover:text-amber-500" />
                <span>Administrator Access</span>
              </button>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-black/[0.06] dark:border-white/[0.08] my-1" />

          {/* Action */}
          <div className="py-0.5">
            {user?.role === 'ADMIN' ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => handleItemClick(onSignOut)}
                className="w-full px-4 py-2 text-xs text-left text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Admin Session</span>
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => handleItemClick(() => onSelectTab('admin'))}
                className="w-full px-4 py-2 text-xs text-left text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors font-medium"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};
