import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, ArrowLeft, Edit, Calendar, Users, DollarSign } from 'lucide-react';
import { api, endpoints } from '../../services/api';
import { Ticket as TicketType } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      setIsLoading(true);
      // For now, create sample ticket data since backend doesn't have ticket endpoints
      const sampleTicket: TicketType = {
        id: Number(id),
        event_id: 1,
        name: 'General Admission',
        price: 2500,
        quantity_available: 100,
        quantity_sold: 25,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        event_name: 'Tech Conference 2024',
        event_location: 'Nairobi, Kenya'
      };
      setTicket(sampleTicket);
    } catch (error: any) {
      toast.error('Failed to load ticket details');
      console.error('Error fetching ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-500/20 text-green-300 border-green-500/30'
      : 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-300 mb-4">Ticket not found</h2>
          <button
            onClick={() => navigate('/events')}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-dark-900 via-dark-800 to-secondary-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/events')}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Events
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{ticket.name}</h1>
                <p className="text-gray-400">{ticket.event_name}</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </motion.div>

        {/* Ticket Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Ticket Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Price</p>
                    <p className="text-white font-semibold">KSh {ticket.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Quantity Available</p>
                    <p className="text-white font-semibold">{ticket.quantity_available}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <Users className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Quantity Sold</p>
                    <p className="text-white font-semibold">{ticket.quantity_sold}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${ticket.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Event Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <Calendar className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="text-sm text-gray-400">Event</p>
                    <p className="text-white font-semibold">{ticket.event_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <Calendar className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-gray-400">Location</p>
                    <p className="text-white font-semibold">{ticket.event_location}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <Calendar className="w-5 h-5 text-accent-400" />
                  <div>
                    <p className="text-sm text-gray-400">Created</p>
                    <p className="text-white font-semibold">
                      {format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-sm text-gray-400">Last Updated</p>
                    <p className="text-white font-semibold">
                      {format(new Date(ticket.updated_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Sales Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {Math.round((ticket.quantity_sold / ticket.quantity_available) * 100)}%
                </p>
                <p className="text-sm text-gray-400">Sold</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {ticket.quantity_available - ticket.quantity_sold}
                </p>
                <p className="text-sm text-gray-400">Remaining</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  KSh {(ticket.price * ticket.quantity_sold).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">Revenue</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TicketDetails;