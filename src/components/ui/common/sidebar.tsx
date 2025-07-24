import React from 'react';
import { ChevronUpIcon, ChevronDownIcon, Settings, Home } from 'lucide-react';
import { store } from '@/lib/store/store';
import { useUrlParams } from '@/lib/utils/urlParams';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import UserIconLogo from '@/../public/images/icons/sidebarIcons/user.svg';
import DashboardIconLogo from '@/../public/images/icons/sidebarIcons/dashboard.svg';
import ConsolidationIconLogo from '@/../public/images/icons/sidebarIcons/consolidation.svg';
import ReportsIconLogo from '@/../public/images/icons/sidebarIcons/reports.svg';
import FinChatIconLogo from '@/../public/images/icons/sidebarIcons/chat.svg';
import ComponentsIconLogo from '@/../public/images/icons/sidebarIcons/components.svg';
import Image from 'next/image';

const UserIcon = () => {
  return <Image src={UserIconLogo} alt="User" width={16} height={16} />;
};

const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="w-4 h-4" />,
    href: '/',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Image src={DashboardIconLogo} alt="Dashboard" width={16} height={16} />,
    href: '/dashboard',
  },
  {
    id: 'FinChat',
    label: 'Fin Chat',
    icon: <Image src={FinChatIconLogo} alt="Fin Chat" width={16} height={16} />,

    href: '/chat',
  },
  {
    id: 'components',
    label: 'Components',
    icon: <Image src={ComponentsIconLogo} alt="Components" width={16} height={16} />,
    href: '/components',
  },
  {
    id: 'Reports',
    label: 'Reports',
    icon: <Image src={ReportsIconLogo} alt="Reports" width={16} height={16} />,
    href: '/reports',
  },
  {
    id: 'Mapping',
    label: 'Mapping',
    icon: <Image src={ConsolidationIconLogo} alt="Mapping" width={16} height={16} />,
    href: '/consolidation',
  },
];

// Reusable Navigation Button Component
interface NavButtonProps {
  item: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClickSettings?: () => void;
  };
  variant?: 'ghost' | 'outline' | 'link';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  isCollapsed?: boolean;
  isActive?: boolean;
}

const buttonBase =
  'flex items-center hover:bg-gray-100 gap-2 px-3 py-2 rounded-md transition-colors duration-150 w-full text-sm justify-start focus:outline-none focus:ring-2 text-primary focus:ring-offset-2';

const footerItems = [
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
    onClickSettings: () => {
      // This will be handled by the onClick prop in the NavButton
    },
  },
];

// Tooltip Component
interface TooltipProps {
  children: React.ReactNode;
  content: string;
  isVisible: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, isVisible }) => {
  return (
    <div className="relative group">
      {children}
      {isVisible && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none top-1/2 -translate-y-1/2">
          {content}
          <div className="absolute top-1/2 right-full transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<NavButtonProps> = ({
  item,
  className = '',
  onClick,
  children,
  isCollapsed = false,
  isActive = false,
}) => {
  return (
    <Tooltip content={item.label} isVisible={isCollapsed}>
      <button
        type="button"
        className={`${buttonBase} ${isCollapsed ? 'justify-center' : ''} ${
          isActive ? 'bg-gray-100 text-primary font-medium' : ''
        } ${className}`}
        onClick={onClick}
        title={isCollapsed ? item.label : undefined}
      >
        {item.icon && (
          <span className={`w-4 h-4 flex items-center justify-center ${isActive ? 'text-primary' : 'text-primary'}`}>
            {item.icon}
          </span>
        )}
        {!isCollapsed && <span className="truncate text-left">{children || item.label}</span>}
      </button>
    </Tooltip>
  );
};

interface SidebarProps {
  isCollapsed?: boolean;
  onClickSettings?: () => void;
}

export function Sidebar({ isCollapsed = false, onClickSettings }: SidebarProps) {
  const companyModalId = 'company-selection';
  const selectedCompany = store.getState().user.selectedCompany;
  const router = useRouter();
  const pathname = usePathname();
  const { toggleComponentState } = useUrlParams();

  // Function to check if a navigation item is active
  const isActiveItem = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/dashboard') {
      return pathname.startsWith('/dashboard');
    }
    if (href === '/chat') {
      return pathname.startsWith('/chat');
    }
    if (href === '/components') {
      return pathname.startsWith('/components');
    }
    if (href === '/reports') {
      return pathname.startsWith('/reports');
    }
    if (href === '/consolidation') {
      return pathname.startsWith('/consolidation');
    }
    return pathname === href;
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-56'
      } bg-white border-r flex flex-col justify-between transition-all duration-300`}
    >
      <div>
        <div className={`flex items-center py-3.5 border-b ${isCollapsed ? 'px-2 justify-center' : 'px-4 gap-3'}`}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleComponentState(companyModalId, true);
            }}
            className={`flex cursor-pointer h-full w-full ${
              isCollapsed ? 'justify-center' : 'justify-between items-center gap-3'
            }`}
          >
            <Avatar className="bg-[#E8F1FF]">
              <AvatarFallback>
                <UserIcon />
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <span className="font-medium text-base text-primary truncate">
                  {selectedCompany?.name || 'Select Company'}
                </span>
                <div className="flex flex-col ml-auto">
                  <ChevronUpIcon className="h-3 w-3 text-sec" />
                  <ChevronDownIcon className="h-3 w-3 text-sec -mt-1" />
                </div>
              </>
            )}
          </div>
        </div>
        <nav className={`space-y-4 py-3 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {navigationItems.map((item) => (
            <NavButton
              onClick={() => {
                if (item.href) {
                  router.push(item.href);
                }
              }}
              item={item}
              className="text-primary"
              key={item.id}
              variant="link"
              isCollapsed={isCollapsed}
              isActive={isActiveItem(item.href || '')}
            >
              {item.label}
            </NavButton>
          ))}
        </nav>
      </div>
      <div className={`space-y-2 pb-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {/* Mapped Footer Items */}
        {footerItems.map((item) => (
          <NavButton
            item={item}
            className="text-primary"
            key={item.id}
            variant="link"
            isCollapsed={isCollapsed}
            onClick={() => onClickSettings?.()}
            isActive={pathname.includes('/settings')}
          >
            {item.label}
          </NavButton>
        ))}
      </div>
    </aside>
  );
}
