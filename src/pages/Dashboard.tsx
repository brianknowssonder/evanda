import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Ticket, 
  Settings, 
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Users,
  Shield,
  Plus,
  Edit,
  Eye,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Event, Order } from '../types';
import ConnectionTest from '../components/Debug/ConnectionTest';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  upcomingEvents: number;
  ticketsSold?: number;
  revenue?: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalOrders: 0,
    totalSpent: 0,
    upcomingEvents: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showConnectionTest, setShowConnectionTest] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch events
      const eventsResponse = await apiService.getEvents();
      const allEvents = eventsResponse?.data?.events || [];

      // Fetch orders for customers
      if (user?.role === 'customer') {
        const ordersResponse = await apiService.getUserOrders();
        const userOrders = ordersResponse?.data?.orders || [];
        setOrders(userOrders);

        // Calculate stats
        const totalOrders = userOrders.length;
        const totalSpent = userOrders.reduce((sum: number, order: Order) => sum + order.total_amount, 0);
        const upcomingEvents = userOrders.filter((order: Order) => order.order_status === 'paid').length;

        setStats({
          totalOrders,
          totalSpent,
          upcomingEvents
        });
      }

      // Filter events based on role
      if (user?.role === 'organizer') {
        const organizerEvents = allEvents.filter((event: Event) => event.organizer_id === user.id);
        setEvents(organizerEvents);
        setStats({
          totalOrders: organizerEvents.length,
          totalSpent: 0,
          upcomingEvents: organizerEvents.filter((event: Event) => new Date(event.start_time) > new Date()).length,
          ticketsSold: 234,
          revenue: 'KSh 45,600'
        });
      } else if (user?.role === 'admin') {
        setEvents(allEvents);
        setStats({
          totalOrders: allEvents.length,
          totalSpent: 0,
          upcomingEvents: allEvents.filter((event: Event) => new Date(event.start_time) > new Date()).length,
          ticketsSold: 5678
        });
      } else {
        setEvents(allEvents);
      }
    } catch (error: any) {
      console.error('Full error object:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });

      if (error?.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        window.location.href = '/login';
      } else {
        toast.error(`Failed to load dashboard data: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-400 bg-green-400/10';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getRoleBasedTabs = () => {
    const baseTabs = [
      { id: 'overview', name: 'Overview', icon: User },
      { id: 'settings', name: 'Settings', icon: Settings },
    ];

    if (user?.role === 'customer') {
      baseTabs.splice(1, 0, { id: 'orders', name: 'My Orders', icon: Ticket });
    } else if (user?.role === 'organizer') {
      baseTabs.splice(1, 0, 
        { id: 'events', name: 'My Events', icon: Calendar },
        { id: 'create-event', name: 'Create Event', icon: Plus }
      );
    } else if (user?.role === 'admin') {
      baseTabs.splice(1, 0,
        { id: 'events', name: 'All Events', icon: Calendar },
        { id: 'users', name: 'Manage Users', icon: Users },
        { id: 'admin-panel', name: 'Admin Panel', icon: Shield }
      );
    }

    return baseTabs;
  };

  const getStatsCards = () => {
    if (user?.role === 'customer') {
      return [
        {
          title: 'Total Orders',
          value: stats.totalOrders,
          icon: Ticket,
          color: 'blue',
          gradient: 'from-primary-500 to-primary-600'
        },
        {
          title: 'Total Spent',
          value: `KSh ${stats.totalSpent.toLocaleString()}`,
          icon: ShoppingCart,
          color: 'green',
          gradient: 'from-secondary-500 to-secondary-600'
        },
        {
          title: 'Upcoming Events',
          value: stats.upcomingEvents,
          icon: Star,
          color: 'purple',
          gradient: 'from-accent-500 to-accent-600'
        },
        {
          title: 'My Tickets',
          value: orders.filter(o => o.order_status === 'paid').length,
          icon: Ticket,
          color: 'orange',
          gradient: 'from-yellow-500 to-yellow-600'
        }
      ];
    } else if (user?.role === 'organizer') {
      return [
        {
          title: 'My Events',
          value: stats.totalOrders,
          icon: Calendar,
          color: 'blue',
          gradient: 'from-primary-500 to-primary-600'
        },
        {
          title: 'Upcoming Events',
          value: stats.upcomingEvents,
          icon: Clock,
          color: 'green',
          gradient: 'from-secondary-500 to-secondary-600'
        },
        {
          title: 'Tickets Sold',
          value: stats.ticketsSold || 0,
          icon: Ticket,
          color: 'purple',
          gradient: 'from-accent-500 to-accent-600'
        },
        {
          title: 'Revenue',
          value: stats.revenue || 'KSh 0',
          icon: TrendingUp,
          color: 'orange',
          gradient: 'from-yellow-500 to-yellow-600'
        }
      ];
    } else {
      return [
        {
          title: 'Total Events',
          value: stats.totalOrders,
          icon: Calendar,
          color: 'blue',
          gradient: 'from-primary-500 to-primary-600'
        },
        {
          title: 'Active Events',
          value: stats.upcomingEvents,
          icon: Clock,
          color: 'green',
          gradient: 'from-secondary-500 to-secondary-600'
        },
        {
          title: 'Platform Users',
          value: '1,000+',
          icon: Users,
          color: 'purple',
          gradient: 'from-accent-500 to-accent-600'
        },
        {
          title: 'Active Tickets',
          value: stats.ticketsSold || '5,678',
          icon: Ticket,
          color: 'orange',
          gradient: 'from-yellow-500 to-yellow-600'
        }
      ];
    }
  };

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'admin':
        return 'Welcome to your admin dashboard. Manage users, events, and system settings.';
      case 'organizer':
        return 'Welcome to your organizer dashboard. Create and manage your events.';
      default:
        return 'Welcome to EVANDA. Discover and book tickets for amazing events.';
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const tabs = getRoleBasedTabs();
  const statsCards = getStatsCards();

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-dark-900 via-dark-800 to-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-400">
              {getWelcomeMessage()}
            </p>
          </div>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowConnectionTest(!showConnectionTest)}
              className="inline-flex items-center px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-colors text-white"
            >
              <Settings className="h-5 w-5 mr-2" />
              Debug
            </button>
          )}
        </motion.div>

        {showConnectionTest && user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <ConnectionTest />
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 ${getColorClasses(stat.color)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-gray-400 text-sm">{stat.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                {user?.role === 'customer' && 'Recent Orders'}
                {(user?.role === 'organizer' || user?.role === 'admin') && 'Recent Events'}
              </h2>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-white/10 rounded mb-2"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {user?.role === 'customer' && orders.length === 0 && (
                    <div className="text-center py-8">
                      <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No orders yet</p>
                      <p className="text-sm text-gray-500 mt-2">Book your first event to see it here</p>
                    </div>
                  )}
                  
                  {user?.role === 'customer' && orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id} 
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(order.order_status)}
                          <div>
                            <p className="text-white font-medium">Order #{order.id}</p>
                            <p className="text-sm text-gray-400">
                              {format(new Date(order.created_at), 'MMM dd, yyyy')} • {order.items?.length || 0} tickets
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">KSh {order.total_amount.toLocaleString()}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                            {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(user?.role === 'organizer' || user?.role === 'admin') && events.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Calendar className="w-5 h-5 text-primary-400" />
                          <div>
                            <p className="text-white font-medium">{event.title}</p>
                            <p className="text-sm text-gray-400">
                              {format(new Date(event.start_time), 'MMM dd, yyyy')} • {event.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {(user?.role === 'organizer' || user?.role === 'admin') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user?.role === 'organizer' && (
                    <button className="p-4 text-left bg-blue-50/10 hover:bg-blue-100/10 rounded-lg transition-colors border border-blue-200/20">
                      <Calendar className="h-6 w-6 text-blue-400 mb-2" />
                      <h3 className="font-medium text-white">Create Event</h3>
                      <p className="text-sm text-gray-400">Set up a new event</p>
                    </button>
                  )}
                  <button className="p-4 text-left bg-green-50/10 hover:bg-green-100/10 rounded-lg transition-colors border border-green-200/20">
                    <Ticket className="h-6 w-6 text-green-400 mb-2" />
                    <h3 className="font-medium text-white">View Tickets</h3>
                    <p className="text-sm text-gray-400">Manage your tickets</p>
                  </button>
                  {user?.role === 'admin' && (
                    <button className="p-4 text-left bg-purple-50/10 hover:bg-purple-100/10 rounded-lg transition-colors border border-purple-200/20">
                      <Users className="h-6 w-6 text-purple-400 mb-2" />
                      <h3 className="font-medium text-white">Manage Users</h3>
                      <p className="text-sm text-gray-400">User administration</p>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab !== 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center"
          >
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h3>
            <p className="text-gray-400">
              This section is under development. Advanced features will be available here.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;