import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon,
  FolderKanbanIcon,
  MessageCircleIcon,
  SettingsIcon,
  UserIcon } from
'lucide-react';
import { ColorCustomizer } from './ColorCustomizer';
interface LeftRailProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  onChatClick: () => void;
}
interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}
export function LeftRail({
  activeItem,
  onItemClick,
  onChatClick
}: LeftRailProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showColorCustomizer, setShowColorCustomizer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navItems: NavItem[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboardIcon,
    label: 'Dashboard'
  },
  {
    id: 'projects',
    icon: FolderKanbanIcon,
    label: 'Projects'
  },
  {
    id: 'chat',
    icon: MessageCircleIcon,
    label: 'Chat',
    onClick: onChatClick
  }];

  const bottomItems: NavItem[] = [
  {
    id: 'settings',
    icon: SettingsIcon,
    label: 'Settings'
  }];

  const allItems = [...navItems, ...bottomItems];
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      const item = allItems[focusedIndex];
      if (item.onClick) {
        item.onClick();
      } else {
        onItemClick(item.id);
      }
    }
  };
  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = activeItem === item.id;
    const isFocused = focusedIndex === index;
    const Icon = item.icon;
    const isSettings = item.id === 'settings';
    return (
      <button
        key={item.id}
        onClick={() => {
          if (isSettings) {
            setShowColorCustomizer(!showColorCustomizer);
          } else if (item.onClick) {
            item.onClick();
          } else {
            onItemClick(item.id);
          }
        }}
        onFocus={() => setFocusedIndex(index)}
        className={`
          relative w-full flex items-center p-2 rounded-md transition-colors duration-200
          ${isActive || isSettings && showColorCustomizer ? 'text-[#0461BA] bg-[#E8F1FB]' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}
          ${isFocused ? 'ring-2 ring-[#0461BA] ring-offset-1' : ''}
        `}
        aria-current={isActive ? 'page' : undefined}
        style={{ justifyContent: isHovered ? 'flex-start' : 'center' }}
      >
        {isActive &&
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[#0461BA] rounded-r-full"
            transition={{
              duration: 0.18,
              ease: 'easeOut'
            }} />
        }
        <Icon
          size={18}
          className={`flex-shrink-0 ${isActive || isSettings && showColorCustomizer ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
        {isHovered && (
          <span className="ml-3 text-sm font-medium whitespace-nowrap opacity-100 transition-opacity duration-200">
            {item.label}
          </span>
        )}
      </button>
    );

  };
  return (
    <>
      <motion.nav
        initial={false}
        animate={{
          width: isHovered ? 160 : 44
        }}
        transition={{
          duration: 0.18,
          ease: 'easeOut'
        }}
        onKeyDown={handleKeyDown}
        className="fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 z-20 flex flex-col py-2 overflow-visible"
        role="navigation"
        aria-label="Main navigation"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Profile Avatar */}
        <div className="px-1 mb-3">
          <button
            onClick={() => onItemClick('profile')}
            className={`
              w-8 h-8 rounded-full bg-gradient-to-br from-[#0461BA] to-[#035299] 
              flex items-center justify-center text-white
              hover:ring-2 hover:ring-[#0461BA] hover:ring-offset-1
              focus:ring-2 focus:ring-[#0461BA] focus:ring-offset-1
              transition-shadow mx-auto
            `}
            aria-label="Profile"
            style={{ marginLeft: isHovered ? 8 : 'auto', transition: 'margin 0.18s' }}
          >
            <UserIcon size={14} />
            {isHovered && (
              <span className="ml-3 text-sm font-medium whitespace-nowrap opacity-100 transition-opacity duration-200">
                Profile
              </span>
            )}
          </button>
        </div>

        {/* Main Nav Items */}
        <div className="flex-1 px-1 space-y-1">
          {navItems.map((item, index) => renderNavItem(item, index))}
        </div>

        {/* Bottom Items */}
        <div className="px-1 mt-auto space-y-1">
          {bottomItems.map((item, index) =>
          renderNavItem(item, navItems.length + index)
          )}
        </div>
      </motion.nav>

      {/* Color Customizer Popover */}
      <ColorCustomizer
        isOpen={showColorCustomizer}
        onClose={() => setShowColorCustomizer(false)} />
      
    </>);

}