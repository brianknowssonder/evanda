import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Ticket, 
  Users, 
  Settings, 
  Plus, 
  BarChart3,
  Shield,
  Search,
  Star,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const QuickLinks: React.FC = () => {
  const { user } = useAuth();

  const getQuickLinks = () => {
    if (!user) return [];

    const baseLinks = [
      {
        title: 'Browse Events',
        description: 'Discover amazing events',
        icon: Search,
        href: '/events',
        gradient: 'from-blue-500 to-cyan-400',
        available: true
      },
      {
        title: 'My Dashboard',
        description: 'View your activity',
        icon: BarChart3,
        href: '/dashboard',
        gradient: 'from-purple-500 to-pink-400',
        available: true
      }
    ];

    if (user.role === 'customer') {
      return [
        ...baseLinks,
        {
          title: 'My Tickets',
          description: 'View purchased tickets',
          icon: Ticket,
          href: '/dashboard?tab=orders',
          gradient: 'from-green-500 to-emerald-400',
          available: true
        },
        {
          title: 'Favorites',
          description: 'Saved events',
          icon: Star,
          href: '/favorites',
          gradient: 'from-yellow-500 to-orange-400',
          available: false
        }
      ];
    }

    if (user.role === 'organizer') {
      return [
        ...baseLinks,
        {
          title: 'Create Event',
          description: 'Host a new event',
          icon: Plus,
          href: '/create-event',
          gradient: 'from-green-500 to-emerald-400',
          available: true
        },
        {
          title: 'My Events',
          description: 'Manage your events',
          icon: Calendar,
          href: '/dashboard?tab=events',
          gradient: 'from-orange-500 to-red-400',
          available: true
        },
        {
          title: 'Analytics',
          description: 'Event performance',
          icon: BarChart3,
          href: '/analytics',
          gradient: 'from-indigo-500 to-purple-400',
          available: false
        }
      ];
    }

    if (user.role === 'admin') {
      return [
        ...baseLinks,
        {
          title: 'Admin Panel',
          description: 'Platform management',
          icon: Shield,
          href: '/admin',
          gradient: 'from-red-500 to-pink-400',
          available: true
        },
        {
          title: 'User Management',
          description: 'Manage all users',
          icon: Users,
          href: '/admin?tab=users',
          gradient: 'from-green-500 to-emerald-400',
          available: true
        },
        {
          title: 'System Settings',
          description: 'Platform configuration',
          icon: Settings,
          href: '/admin?tab=settings',
          gradient: 'from-gray-500 to-gray-600',
          available: false
        }
      ];
    }

    return baseLinks;
  };

  const quickLinks = getQuickLinks();

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Clock className="w-6 h-6 mr-3 text-primary-400" />
        Quick Actions
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link, index) => (
          <motion.div
            key={link.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            {link.available ? (
              <Link
                to={link.href}
                className="block p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${link.gradient}`}>
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium group-hover:text-primary-300 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-xs text-gray-400">{link.description}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="block p-4 bg-white/5 border border-white/10 rounded-xl opacity-50 cursor-not-allowed">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${link.gradient}`}>
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{link.title}</h3>
                    <p className="text-xs text-gray-400">{link.description}</p>
                    <p className="text-xs text-yellow-400 mt-1">Coming Soon</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuickLinks;