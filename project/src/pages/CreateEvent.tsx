import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  FileText, 
  Users, 
  ArrowRight,
  Plus,
  X
} from 'lucide-react';
import { api, endpoints } from '../services/api';
import toast from 'react-hot-toast';

interface TicketType {
  name: string;
  price: number;
  quantity: number;
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
  });
  const [tickets, setTickets] = useState<TicketType[]>([
    { name: 'General Admission', price: 0, quantity: 100 }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleTicketChange = (index: number, field: keyof TicketType, value: string | number) => {
    setTickets(prev => prev.map((ticket, i) => 
      i === index ? { ...ticket, [field]: value } : ticket
    ));
  };

  const addTicketType = () => {
    setTickets(prev => [...prev, { name: '', price: 0, quantity: 0 }]);
  };

  const removeTicketType = (index: number) => {
    if (tickets.length > 1) {
      setTickets(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const { title, start_time, end_time } = formData;
    
    if (!title.trim()) {
      toast.error('Event title is required');
      return false;
    }

    if (!start_time || !end_time) {
      toast.error('Start and end times are required');
      return false;
    }

    if (new Date(start_time) >= new Date(end_time)) {
      toast.error('End time must be after start time');
      return false;
    }

    if (new Date(start_time) <= new Date()) {
      toast.error('Start time must be in the future');
      return false;
    }

    // Validate tickets
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (!ticket.name.trim()) {
        toast.error(`Ticket ${i + 1} name is required`);
        return false;
      }
      if (ticket.price < 0) {
        toast.error(`Ticket ${i + 1} price cannot be negative`);
        return false;
      }
      if (ticket.quantity <= 0) {
        toast.error(`Ticket ${i + 1} quantity must be greater than 0`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      // Create event
      const eventResponse = await api.post(endpoints.events, formData);
      const eventId = eventResponse.data.event_id;
      
      // Create tickets for the event
      for (const ticket of tickets) {
        await api.post(endpoints.createTicketForEvent(eventId), {
          name: ticket.name,
          price: ticket.price,
          quantity_available: ticket.quantity
        });
      }
      
      toast.success('Event created successfully!');
      navigate('/events');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create event';
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
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Create New Event
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Bring your vision to life and connect with your audience
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FileText className="w-6 h-6 mr-3 text-primary-400" />
                Event Information
              </h2>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your event title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Describe your event..."
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Event venue or location"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Clock className="w-6 h-6 mr-3 text-secondary-400" />
                Date & Time
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="start_time"
                    name="start_time"
                    required
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-300 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="end_time"
                    name="end_time"
                    required
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Tickets */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Users className="w-6 h-6 mr-3 text-accent-400" />
                  Ticket Types
                </h2>
                <button
                  type="button"
                  onClick={addTicketType}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Ticket</span>
                </button>
              </div>

              <div className="space-y-4">
                {tickets.map((ticket, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-white">
                        Ticket Type {index + 1}
                      </h3>
                      {tickets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketType(index)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Ticket Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={ticket.name}
                          onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., General Admission"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Price (KSh) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={ticket.price}
                          onChange={(e) => handleTicketChange(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={ticket.quantity}
                          onChange={(e) => handleTicketChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-6 border-t border-white/10"
            >
              <button
                type="submit"
                disabled={isLoading}
                className="group w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold text-lg rounded-xl hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Create Event
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateEvent;