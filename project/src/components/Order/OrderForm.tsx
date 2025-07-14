import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react';
import { api, endpoints } from '../../services/api';
import { Event, Ticket } from '../../types';
import toast from 'react-hot-toast';
import MpesaPayment from '../MpesaPayment';

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventAndTickets();
    }
  }, [id]);

  const fetchEventAndTickets = async () => {
    try {
      setIsLoading(true);
      const eventResponse = await api.get(endpoints.eventById(Number(id)));
      setEvent(eventResponse.data.event);
      
      // Create sample tickets since backend doesn't have ticket endpoints for events
      setTickets([
        {
          id: 1,
          event_id: Number(id),
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
          event_id: Number(id),
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
      toast.error('Failed to load event details');
      console.error('Error fetching event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketQuantityChange = (ticketId: number, change: number) => {
    setSelectedTickets(prev => {
      const currentQuantity = prev[ticketId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      const ticket = tickets.find(t => t.id === ticketId);
      const maxQuantity = ticket ? ticket.quantity_available - ticket.quantity_sold : 0;
      
      return {
        ...prev,
        [ticketId]: Math.min(newQuantity, maxQuantity)
      };
    });
  };

  const calculateTotal = () => {
    return tickets.reduce((total, ticket) => {
      const quantity = selectedTickets[ticket.id] || 0;
      return total + (ticket.price * quantity);
    }, 0);
  };

  const handleBookTickets = async () => {
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
      await api.patch(`/orders/${orderId}`, { order_status: 'paid' });
      toast.success('Payment successful! Your tickets have been booked.');
      navigate('/orders');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.success('Payment successful! Check your orders for tickets.');
      navigate('/orders');
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setOrderId(null);
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
    <div className="min-h-screen pt-16 bg-gradient-to-br from-dark-900 via-dark-800 to-secondary-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Event Details
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                Book Tickets
              </span>
            </h1>
            <p className="text-gray-400 text-lg">{event.title}</p>
          </div>
        </motion.div>

        {/* Ticket Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-3 text-primary-400" />
            Select Tickets
          </h2>

          <div className="space-y-6">
            {tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{ticket.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{ticket.quantity_available - ticket.quantity_sold} available</span>
                      <span className="text-2xl font-bold text-primary-400">
                        KSh {ticket.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTicketQuantityChange(ticket.id, -1)}
                        disabled={!selectedTickets[ticket.id]}
                        className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center text-white font-medium">
                        {selectedTickets[ticket.id] || 0}
                      </span>
                      <button
                        onClick={() => handleTicketQuantityChange(ticket.id, 1)}
                        disabled={(selectedTickets[ticket.id] || 0) >= (ticket.quantity_available - ticket.quantity_sold)}
                        className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
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
                  'Proceed to Payment'
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OrderForm;