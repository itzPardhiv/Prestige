import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Search, BookOpen } from 'lucide-react';
import { soundService } from '../../../services/sound';
import { UserProfile } from '../../../types/user';
import { ProfileDropdown } from '../../layout/ProfileDropdown';

export type NavTab = 'dashboard' | 'decode' | 'challenges' | 'reports' | 'archive' | 'profile' | 'faq' | 'admin';

export interface SpotlightNavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings?: () => void;
  onOpenTerms?: () => void;
  onSignOut?: () => void;
}

export const SpotlightNavbar: React.FC<SpotlightNavbarProps> = ({
  activeTab,
  onSelectTab,
  user,
  darkMode,
  onToggleDarkMode,
  onOpenSettings = () => {},
  onOpenTerms = () => {},
  onSignOut = () => {},
}) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const headerRef = useRef<HTMLElement>(null);

  const navItems: Array<{ id: NavTab; label: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'decode', label: 'Decode' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'reports', label: 'Reports' },
    { id: 'archive', label: 'History' },
    { id: 'faq', label: 'FAQ' },
    ...(user?.role === 'ADMIN' ? [{ id: 'admin' as NavTab, label: 'Admin' }] : []),
  ];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!headerRef.current) return;
    const rect = headerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleTabClick = (tab: NavTab) => {
    soundService.playKeyClick();
    onSelectTab(tab);
  };

  return (
    <header
      ref={headerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="sticky top-0 z-40 bg-surface-canvas/90 backdrop-blur-md border-b border-border transition-colors relative"
    >
      {/* Vengeance UI Spotlight tracking gradient */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.08), transparent 80%)`,
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex items-center justify-between h-14">
          {/* Left: Clean Brand Wordmark & Primary Links */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleTabClick('dashboard')}
              className="flex items-center gap-2 group text-left"
            >
              <span className="font-semibold text-sm tracking-tight text-content-primary">
                PRESTIGE
              </span>
              <span className="text-[11px] text-content-tertiary hidden sm:inline">
                / Cryptography Platform
              </span>
            </button>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-md transition-colors relative select-none
                      ${
                        isActive
                          ? 'text-content-primary font-semibold'
                          : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary/50'
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active-pill"
                        className="absolute inset-0 bg-surface-secondary rounded-md"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="navbar-active-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-500 rounded-full z-10"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Theme Toggle & Profile Dropdown */}
          <div className="flex items-center gap-3">

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 text-content-secondary hover:text-content-primary hover:bg-surface-secondary rounded-md transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Dropdown Component */}
            <ProfileDropdown
              user={user}
              onSelectTab={onSelectTab}
              onOpenSettings={onOpenSettings}
              onOpenTerms={onOpenTerms}
              onSignOut={onSignOut}
            />
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-border-subtle">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`
                  px-2.5 py-1 text-xs font-medium whitespace-nowrap rounded-md transition-colors
                  ${
                    isActive
                      ? 'bg-surface-secondary text-content-primary font-semibold'
                      : 'text-content-secondary hover:text-content-primary'
                  }
                `}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
