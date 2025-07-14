import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, ArrowLeft, Save, Calendar } from 'lucide-react';
import { api, endpoints } from '../../services/api';
import toast from 'react-hot-toast';

const TicketForm: React.FC = () => {
  const { eventId, id } = useParams<{ eventId: string; id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    quantity_available: 0,
    expiry_date: '',
  });

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
    if (isEditing && id) {
      fetchTicket();
    }
  }, [eventId, id, isEditing]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(endpoints.eventById(Number(eventId)));
      setEventTitle(response.data.event.title);
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const fetchTicket = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(endpoints.ticketById(Number(id)));
      const ticket = response.data.ticket;
      setFormData({
        name: ticket.name || '',
        price: ticket.price || 0,
        quantity_available: ticket.quantity_available || 0,
        expiry_date: ticket.expiry_date ? new Date(ticket.expiry_date).toISOString().slice(0, 16) : '',
      });
    } catch (error: any) {
      toast.error('Failed to load ticket details');
      console.error('Error fetching ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const validateForm = () => {
    const { name, price, quantity_available } = formData;
    
    if (!name.trim()) {
      toast.error('Ticket name is required');
      return false;
    }

    if (price < 0) {
      toast.error('Price cannot be negative');
      return false;
    }

    if (quantity_available <= 0) {
      toast.error('Quantity must be greater than 0');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      if (isEditing) {
        await api.put(endpoints.ticketById(Number(id)), formData);
        toast.success('Ticket updated successfully!');
      } else {
        await api.post(endpoints.createTicketForEvent(Number(eventId)), formData);
        toast.success('Ticket created successfully!');
      }
      
      navigate(`/events/${eventId}/tickets`);
    } catch (error: any) {
      const message = error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} ticket`;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

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
            onClick={() => navigate(`/events/${eventId}/tickets`)}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tickets
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                {isEditing ? 'Edit Ticket' : 'Create New Ticket'}
              </span>
            </h1>
            {eventTitle && (
              <p className="text-gray-400 text-lg">
                For event: {eventTitle}
              </p>
            )}
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Ticket className="w-6 h-6 mr-3 text-primary-400" />
                Ticket Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Ticket Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., General Admission, VIP Pass"
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                    Price (KSh) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="quantity_available" className="block text-sm font-medium text-gray-300 mb-2">
                    Quantity Available *
                  </label>
                  <input
                    type="number"
                    id="quantity_available"
                    name="quantity_available"
                    required
                    min="1"
                    value={formData.quantity_available}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-300 mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    id="expiry_date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    Leave empty if tickets don't expire
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-6 border-t border-white/10"
            >
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(`/events/${eventId}/tickets`)}
                  className="flex-1 py-3 px-4 bg-white/10 border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Save className="w-5 h-5 mr-2" />
                      {isEditing ? 'Update Ticket' : 'Create Ticket'}
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default TicketForm;