import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Ticket, 
  Settings, 
  Download,
  CheckCircle,
  XCircle,
  Star,
  Users,
  Shield,
  Plus,
  Edit,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, endpoints } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import UserProfileCard from '../components/UserProfileCard';
import { Order, Event, User as UserType } from '../types';

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  upcomingEvents: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalOrders: 0,
    totalSpent: 0,
    upcomingEvents: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user orders for customers
      if (user?.role === 'customer') {
        const userOrdersResponse = await api.getUserOrders();
        const userOrders = userOrdersResponse?.data?.orders || [];
        setOrders(userOrders);
        
        // Calculate stats
        const totalOrders = userOrders.length;
        const totalSpent = userOrders.reduce((sum: number, order: Order) => sum + order.total_amount, 0);
        const upcomingEvents = userOrders.filter((order: Order) => order.order_status === 'paid').length;
        
        setStats({ totalOrders, totalSpent, upcomingEvents });
      }
      
      // Fetch events for organizers
      if (user?.role === 'organizer' || user?.role === 'admin') {
        const allEventsResponse = await api.getEvents();
        const allEvents = allEventsResponse?.data?.events || [];
        
        if (user?.role === 'organizer') {
          // Filter events created by this organizer
          const organizerEvents = allEvents.filter((event: Event) => event.organizer_name === user.name);
          setEvents(organizerEvents);
          setStats({
            totalOrders: organizerEvents.length,
            totalSpent: 0,
            upcomingEvents: organizerEvents.filter((event: Event) => new Date(event.start_time) > new Date()).length
          });
        } else {
          // Admin sees all events
          setEvents(allEvents);
          setStats({
            totalOrders: allEvents.length,
            totalSpent: 0,
            upcomingEvents: allEvents.filter((event: Event) => new Date(event.start_time) > new Date()).length
          });
        }
      }

      // Fetch user profile
      if (user?.id) {
        try {
          const userProfileResponse = await api.getUserById(user.id);
          const userProfile = userProfileResponse?.data?.user || null;
          setUserProfile(userProfile);
        } catch (error) {
          // If specific user endpoint fails, use current user data
          setUserProfile({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: new Date().toISOString()
          });
        }
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <XCircle className="w-5 h-5 text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
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

  const handleDownloadTicket = async (orderId: number) => {
    try {
      await api.post(endpoints.generateTicket, { order_id: orderId });
      toast.success('Ticket sent to your email!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to generate ticket';
      toast.error(message);
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

  const getRoleBasedStats = () => {
    if (user?.role === 'customer') {
      return [
        {
          title: 'Total Orders',
          value: stats.totalOrders,
          icon: Ticket,
          gradient: 'from-primary-500 to-primary-600'
        },
        {
          title: 'Total Spent',
          value: `KSh ${stats.totalSpent.toLocaleString()}`,
          icon: Calendar,
          gradient: 'from-secondary-500 to-secondary-600'
        },
        {
          title: 'Upcoming Events',
          value: stats.upcomingEvents,
          icon: Star,
          gradient: 'from-accent-500 to-accent-600'
        }
      ];
    } else if (user?.role === 'organizer') {
      return [
        {
          title: 'My Events',
          value: stats.totalOrders,
          icon: Calendar,
          gradient: 'from-primary-500 to-primary-600'
        },
        {
          title: 'Upcoming Events',
          value: stats.upcomingEvents,
          icon: Calendar,
          gradient: 'from-secondary-500 to-secondary-600'
        },
        {
          title: 'Total Revenue',
          value: 'KSh 0', // Would need to calculate from ticket sales
          icon: Star,
          gradient: 'from-accent-500 to-accent-600'
        }
      ];
    } else {
      return [
        {
          title: 'Total Events',
          value: stats.totalOrders,
          icon: Calendar,
          gradient: 'from-primary-500 to-primary-600'
        },
        {
          title: 'Active Events',
          value: stats.upcomingEvents,
          icon: Calendar,
          gradient: 'from-secondary-500 to-secondary-600'
        },
        {
          title: 'Platform Users',
          value: '1,000+', // Would need to fetch from users endpoint
          icon: Users,
          gradient: 'from-accent-500 to-accent-600'
        }
      ];
    }
  };

  const tabs = getRoleBasedTabs();
  const statCards = getRoleBasedStats();

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
              {user?.role === 'customer' && 'Manage your events and tickets from your dashboard'}
              {user?.role === 'organizer' && 'Create and manage your events'}
              {user?.role === 'admin' && 'Manage the entire EVANDA platform'}
            </p>
          </div>
          
          {/* User Profile Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowUserProfile(true)}
            className="flex items-center space-x-3 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </motion.button>
        </motion.div>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
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
                {user?.role === 'organizer' && 'Recent Events'}
                {user?.role === 'admin' && 'Recent Activity'}
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
                      key={order.order_id}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(order.order_status)}
                          <div>
                            <p className="text-white font-medium">Order #{order.order_id}</p>
                            <p className="text-sm text-gray-400">
                              {format(new Date(order.created_at), 'MMM dd, yyyy')} • {order.item_count} tickets
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
          </motion.div>
        )}

        {/* Other tab contents would be implemented here */}
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

        {/* User Profile Modal */}
        <UserProfileCard 
          isOpen={showUserProfile} 
          onClose={() => setShowUserProfile(false)} 
        />
      </div>
    </div>
  );
};

export default Dashboard;