import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Ticket,
  Users,
  ShoppingCart,
  Settings,
  BarChart3,
  Plus,
  Search,
  QrCode,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Calendar, label: 'Events', path: '/events' },
      { icon: Search, label: 'Search Events', path: '/search' },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: QrCode, label: 'Scanners', path: '/admin/scanners' },
        { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
      ];
    }

    if (user?.role === 'organizer') {
      return [
        ...baseItems,
        { icon: Plus, label: 'Create Event', path: '/organizer/create-event' },
        { icon: Calendar, label: 'My Events', path: '/organizer/events' },
        { icon: Ticket, label: 'Tickets', path: '/organizer/tickets' },
        { icon: BarChart3, label: 'Analytics', path: '/organizer/analytics' },
      ];
    }

    return [
      ...baseItems,
      { icon: Ticket, label: 'My Tickets', path: '/tickets' },
      { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="bg-white shadow-sm w-64 min-h-screen border-r border-gray-200">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;