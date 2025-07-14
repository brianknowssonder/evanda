import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Plus, Edit, Eye, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';
import { api, endpoints } from '../../services/api';
import { Ticket as TicketType } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TicketList: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventAndTickets();
    }
  }, [eventId]);

  const fetchEventAndTickets = async () => {
    try {
      setIsLoading(true);
      
      // Fetch event details
      const eventResponse = await api.get(endpoints.eventById(Number(eventId)));
      setEventTitle(eventResponse.data.event.title);
      
      // For now, create sample tickets since backend doesn't have ticket endpoints
      setTickets([
        {
          id: 1,
          event_id: Number(eventId),
          name: 'General Admission',
          price: 2500,
          quantity_available: 100,
          quantity_sold: 25,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          event_id: Number(eventId),
          name: 'VIP Pass',
          price: 5000,
          quantity_available: 25,
          quantity_sold: 5,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } catch (error: any) {
      toast.error('Failed to load tickets');
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTicketStatus = async (ticketId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      // This would be an API call to update ticket status
      // await api.patch(endpoints.ticketById(ticketId), { status: newStatus });
      
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus as 'active' | 'inactive' } : ticket
      ));
      
      toast.success(`Ticket ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update ticket status';
      toast.error(message);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'text-green-400 bg-green-400/10' 
      : 'text-red-400 bg-red-400/10';
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
          <Link
            to="/events"
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Events
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">Ticket Management</h1>
                <p className="text-gray-400">
                  {eventTitle ? `Managing tickets for: ${eventTitle}` : 'Manage event tickets'}
                </p>
              </div>
            </div>
            
            <Link
              to={`/events/${eventId}/tickets/create`}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium hover:from-primary-700 hover:to-secondary-700 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Create Ticket</span>
            </Link>
          </div>
        </motion.div>

        {/* Tickets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
        >
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No tickets found for this event</p>
              <Link
                to={`/events/${eventId}/tickets/create`}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium hover:from-primary-700 hover:to-secondary-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Ticket</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Ticket Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Available</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Sold</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{ticket.name}</p>
                          <p className="text-gray-400 text-sm">
                            Created {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-semibold">
                          KSh {ticket.price.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-300">{ticket.quantity_available}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-300">{ticket.quantity_sold}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/tickets/${ticket.id}`}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/tickets/${ticket.id}/edit`}
                            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                            title="Edit Ticket"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => toggleTicketStatus(ticket.id, ticket.status)}
                            className={`p-2 rounded-lg transition-colors ${
                              ticket.status === 'active'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                            title={ticket.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {ticket.status === 'active' ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
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

export default TicketList;