import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Edit, Trash2, Plus, Eye } from 'lucide-react';
import { api, endpoints } from '../../services/api';
import { Event } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(endpoints.events);
      setEvents(response.data.events || []);
    } catch (error: any) {
      toast.error('Failed to load events');
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (eventId: number, eventTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(endpoints.eventById(eventId));
      toast.success('Event deleted successfully');
      fetchEvents(); // Refresh the list
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete event';
      toast.error(message);
    }
  };

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Date TBD';
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-dark-900 via-dark-800 to-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">Event Management</h1>
                <p className="text-gray-400">Manage all events on the platform</p>
              </div>
            </div>
            
            <Link
              to="/events/create"
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium hover:from-primary-700 hover:to-secondary-700 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </Link>
          </div>
        </motion.div>

        {/* Events Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
        >
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No events found</p>
              <Link
                to="/events/create"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium hover:from-primary-700 hover:to-secondary-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Event</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Event</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date & Time</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Organizer</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{event.title}</p>
                          <p className="text-gray-400 text-sm line-clamp-1">
                            {event.description || 'No description'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-300">
                          <MapPin className="w-4 h-4 mr-2 text-primary-400" />
                          <span>{event.location || 'Location TBD'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300">
                          <p className="font-medium">{formatEventDate(event.start_time)}</p>
                          <p className="text-sm text-gray-400">
                            to {formatEventDate(event.end_time)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-300">
                          <Users className="w-4 h-4 mr-2 text-secondary-400" />
                          <span>{event.organizer_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/events/${event.id}`}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            title="View Event"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/events/${event.id}/edit`}
                            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteEvent(event.id, event.title)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EventList;