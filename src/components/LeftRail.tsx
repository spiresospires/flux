import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  MessageCircleIcon,
  SettingsIcon,
  PackageIcon,
  FolderIcon } from
'lucide-react';
import { ColorCustomizer } from './ColorCustomizer';
import { useLocalization } from '../contexts/LocalizationContext';
import { useShellLayout } from '../contexts/ShellLayoutContext';
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
  const { t } = useLocalization();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showColorCustomizer, setShowColorCustomizer] = useState(false);
  const { isLeftRailVisible } = useShellLayout();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboardIcon,
    label: t('navigation.home'),
    onClick: () => navigate('/')
  },
  {
    id: 'documents',
    icon: FolderIcon,
    label: t('navigation.documents'),
    onClick: () => navigate('/documents')
  },
  {
    id: 'packages',
    icon: PackageIcon,
    label: t('navigation.packages'),
    onClick: () => navigate('/packages')
  },
  {
    id: 'chat',
    icon: MessageCircleIcon,
    label: t('navigation.chat'),
    onClick: () => navigate('/chat')
  }];

  const bottomItems: NavItem[] = [
  {
    id: 'settings',
    icon: SettingsIcon,
    label: t('navigation.settings')
  }];

  const allItems = [...navItems, ...bottomItems];

  if (!isLeftRailVisible) {
    return null;
  }

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
          relative w-full flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-md transition-colors duration-200
          ${isActive || isSettings && showColorCustomizer ? 'text-[#0461BA] bg-[#E8F1FB]' : 'text-neutral-500 hover:text-neutral-700 hover:bg-[#F0F4F8]'}
          ${isFocused ? 'ring-2 ring-[#0461BA] ring-offset-1' : ''}
        `}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive &&
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#0461BA] rounded-r-full" />
        }
        <Icon
          size={17}
          className={`flex-shrink-0 ${isActive || isSettings && showColorCustomizer ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
        <span className="text-[11px] leading-none font-medium text-center w-full truncate px-1">
          {item.label}
        </span>
      </button>
    );

  };
  return (
    <>
      <nav
        onKeyDown={handleKeyDown}
        className="fixed left-0 top-[45px] h-[calc(100vh-45px)] bg-white border-r border-neutral-200 z-20 flex flex-col py-2 overflow-hidden"
        style={{ width: 88 }}
        role="navigation"
        aria-label={t('navigation.main')}
      >
        {/* Customer logo area */}
        <div className="px-2 mb-3">
          <div
            className="h-20 rounded-md bg-[#E10613] text-white relative overflow-hidden border border-[#C70010]"
            aria-label="Customer logo mockup"
          >
            <div className="h-full flex items-center justify-center">
              <span className="text-lg font-bold tracking-wide lowercase">clough</span>
            </div>
            <span className="absolute right-2 top-3 w-5 h-5 rounded-full border-2 border-white border-l-transparent border-b-transparent rotate-45" />
            <span className="absolute right-1.5 top-2.5 w-7 h-7 rounded-full border border-white/85 border-l-transparent border-b-transparent rotate-45" />
            <span className="absolute right-1 top-2 w-9 h-9 rounded-full border border-white/70 border-l-transparent border-b-transparent rotate-45" />
          </div>
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
      </nav>

      {/* Color Customizer Popover */}
      <ColorCustomizer
        isOpen={showColorCustomizer}
        onClose={() => setShowColorCustomizer(false)} />
      
    </>);

}
