import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Ticket, 
  TrendingUp, 
  Users,
  Plus,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrganizerData();
  }, [user]);

  const fetchOrganizerData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all events
      const allEvents = await api.getEvents();
      
      // Filter events by organizer
      const organizerEvents = allEvents.filter((event: Event) => 
        event.organizer_name === user?.name
      );
      
      setEvents(organizerEvents);
      
      // Calculate stats
      const upcomingEvents = organizerEvents.filter((event: Event) => 
        new Date(event.start_time) > new Date()
      ).length;
      
      setStats({
        totalEvents: organizerEvents.length,
        upcomingEvents,
        totalTicketsSold: 0, // Would need ticket sales data
        totalRevenue: 0      // Would need revenue calculation
      });
      
    } catch (error: any) {
      toast.error('Failed to load organizer data');
      console.error('Error fetching organizer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: Calendar,
      gradient: 'from-blue-500 to-blue-600',
      change: '+5%'
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      gradient: 'from-green-500 to-green-600',
      change: '+2'
    },
    {
      title: 'Tickets Sold',
      value: stats.totalTicketsSold,
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
      title: 'Create Event',
      description: 'Host a new event',
      icon: Plus,
      href: '/create-event',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'View All Events',
      description: 'Browse all events',
      icon: Eye,
      href: '/events',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Scanner Interface',
      description: 'Validate tickets',
      icon: Eye,
      href: '/scanner',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Analytics',
      description: 'View performance',
      icon: BarChart3,
      href: '/analytics',
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
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Organizer Dashboard</h1>
              <p className="text-gray-400">Manage your events and track performance</p>
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

        {/* My Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">My Events</h2>
            <Link
              to="/create-event"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No events created yet</p>
              <Link
                to="/create-event"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium hover:from-primary-700 hover:to-secondary-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Event</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {events.slice(0, 5).map((event) => (
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
                      <Link
                        to={`/events/${event.id}`}
                        className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/events/${event.id}/edit`}
                        className="p-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
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

export default OrganizerDashboard;