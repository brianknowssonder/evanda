import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowLeft, 
  Ticket, 
  Share2,
  Heart,
  Star
} from 'lucide-react';
import { api, endpoints } from '../services/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import MpesaPayment from '../components/MpesaPayment';
import toast from 'react-hot-toast';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  organizer_name: string;
}

interface Ticket {
  id: number;
  name: string;
  price: number;
  quantity_available: number;
  status: string;
}

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<{ [key: number]: number }>({});
  const [isBooking, setIsBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setIsLoading(true);
      const eventResponse = await api.get(endpoints.eventById(Number(id)));
      setEvent(eventResponse.data.event);
      
      // Create sample tickets since backend doesn't have ticket endpoints for events
      setTickets([
        {
          id: 1,
          name: 'General Admission',
          price: 2500,
          quantity_available: 100,
          status: 'active'
        },
        {
          id: 2,
          name: 'VIP Pass',
          price: 5000,
          quantity_available: 25,
          status: 'active'
        }
      ]);
    } catch (error: any) {
      toast.error('Failed to load event details');
      console.error('Error fetching event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketQuantityChange = (ticketId: number, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: Math.max(0, quantity)
    }));
  };

  const calculateTotal = () => {
    return tickets.reduce((total, ticket) => {
      const quantity = selectedTickets[ticket.id] || 0;
      return total + (ticket.price * quantity);
    }, 0);
  };

  const handleBookTickets = async () => {
    if (!user) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }

    const orderItems = Object.entries(selectedTickets)
      .filter(([, quantity]) => quantity > 0)
      .map(([ticketId, quantity]) => ({
        ticket_id: Number(ticketId),
        quantity
      }));

    if (orderItems.length === 0) {
      toast.error('Please select at least one ticket');
      return;
    }

    try {
      setIsBooking(true);
      const response = await api.post(endpoints.orders, {
        items: orderItems
      });
      
      const newOrderId = response.data.order_id;
      setOrderId(newOrderId);
      setShowPayment(true);
      toast.success('Order created! Please complete payment.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Booking failed';
      toast.error(message);
    } finally {
      setIsBooking(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Update order status to paid
      await api.patch(`/orders/${orderId}`, { order_status: 'paid' });
      toast.success('Payment successful! Your tickets have been booked.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.success('Payment successful! Check your dashboard for tickets.');
      navigate('/dashboard');
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setOrderId(null);
    // Optionally cancel the order or keep it as pending
  };

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, MMMM dd, yyyy');
    } catch {
      return 'Date TBD';
    }
  };

  const formatEventTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm');
    } catch {
      return 'Time TBD';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-300 mb-4">Event not found</h2>
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

  if (showPayment && orderId) {
    return (
      <div className="min-h-screen pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MpesaPayment
            amount={calculateTotal()}
            orderId={orderId}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentCancel={handlePaymentCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/events')}
          className="flex items-center text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </motion.button>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Event Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500/20 to-secondary-500/20 h-96">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white">
                      <Star className="w-4 h-4 mr-2" />
                      Featured Event
                    </span>
                    <div className="flex space-x-2">
                      <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
                        <Heart className="w-5 h-5" />
                      </button>
                      <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Event Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                  {event.title}
                </h1>
                <p className="text-xl text-gray-300">
                  {event.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-6 h-6 mr-4 text-primary-400" />
                  <div>
                    <div className="font-medium">{formatEventDate(event.start_time)}</div>
                    <div className="text-sm text-gray-400">
                      {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-300">
                  <MapPin className="w-6 h-6 mr-4 text-secondary-400" />
                  <div>
                    <div className="font-medium">{event.location || 'Location TBD'}</div>
                    <div className="text-sm text-gray-400">Event Venue</div>
                  </div>
                </div>

                <div className="flex items-center text-gray-300">
                  <Users className="w-6 h-6 mr-4 text-accent-400" />
                  <div>
                    <div className="font-medium">Organized by {event.organizer_name}</div>
                    <div className="text-sm text-gray-400">Event Organizer</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tickets Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
          >
            <h2 className="text-3xl font-bold text-white mb-8">Select Tickets</h2>

            <div className="space-y-6">
              {tickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{ticket.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Ticket className="w-4 h-4 mr-1" />
                          {ticket.quantity_available} available
                        </span>
                        <span className="text-2xl font-bold text-primary-400">
                          KSh {ticket.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTicketQuantityChange(ticket.id, (selectedTickets[ticket.id] || 0) - 1)}
                          disabled={!selectedTickets[ticket.id]}
                          className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-white font-medium">
                          {selectedTickets[ticket.id] || 0}
                        </span>
                        <button
                          onClick={() => handleTicketQuantityChange(ticket.id, (selectedTickets[ticket.id] || 0) + 1)}
                          disabled={(selectedTickets[ticket.id] || 0) >= ticket.quantity_available}
                          className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Booking Summary */}
            {calculateTotal() > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 pt-6 border-t border-white/10"
              >
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-semibold text-white">Total</span>
                  <span className="text-3xl font-bold text-primary-400">
                    KSh {calculateTotal().toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={handleBookTickets}
                  disabled={isBooking}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {isBooking ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Processing...
                    </div>
                  ) : (
                    'Book Tickets'
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default EventDetails;