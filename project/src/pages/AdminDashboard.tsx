import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Ticket, 
  BarChart3, 
  Settings,
  Shield,
  TrendingUp,
  Activity,
  UserPlus,
  Plus,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalTickets: 0,
    totalRevenue: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users
      const users = await api.getUsers();
      
      // Fetch events
      const events = await api.getEvents();
      
      setStats({
        totalUsers: users.length,
        totalEvents: events.length,
        totalTickets: 0, // Would need ticket endpoint
        totalRevenue: 0  // Would need revenue calculation
      });
      
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      change: '+12%'
    },
    {
      title: 'Active Events',
      value: stats.totalEvents,
      icon: Calendar,
      gradient: 'from-green-500 to-green-600',
      change: '+5%'
    },
    {
      title: 'Tickets Sold',
      value: stats.totalTickets,
      icon: Ticket,
      gradient: 'from-purple-500 to-purple-600',
      change: '+18%'
    },
    {
      title: 'Revenue',
      value: `KSh ${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-orange-600',
      change: '+24%'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage all platform users',
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Add Scanner',
      description: 'Create new ticket scanner',
      icon: Plus,
      href: '/admin/scanners',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'View Events',
      description: 'Monitor all platform events',
      icon: Calendar,
      href: '/events',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Scanner Interface',
      description: 'Access ticket validation',
      icon: Eye,
      href: '/scanner',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-dark-900 via-dark-800 to-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400">Manage your EVANDA platform</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-400 text-sm font-medium">
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-gray-400 text-sm">{stat.title}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Link
                  to={action.href}
                  className="block p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300"
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                  <p className="text-gray-400 text-sm">{action.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { action: 'New user registered', time: '2 minutes ago', icon: UserPlus },
                { action: 'Event "Tech Conference 2024" created', time: '15 minutes ago', icon: Calendar },
                { action: '50 tickets sold for "Music Festival"', time: '1 hour ago', icon: Ticket },
                { action: 'Payment processed: KSh 15,000', time: '2 hours ago', icon: TrendingUp },
                { action: 'New organizer approved', time: '3 hours ago', icon: Shield },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
                  <div className="p-2 bg-primary-500/20 rounded-lg">
                    <activity.icon className="w-4 h-4 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-gray-400 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;