import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Download, CheckCircle, XCircle, Clock, Calendar, Ticket } from 'lucide-react';
import { api, endpoints } from '../../services/api';
import { Order, OrderItem } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(endpoints.orderById(Number(id)));
      setOrder(response.data.order);
      setOrderItems(response.data.order.items || []);
    } catch (error: any) {
      toast.error('Failed to load order details');
      console.error('Error fetching order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-400" />;
      default:
        return <XCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const handleDownloadTicket = async () => {
    try {
      await api.post(endpoints.generateTicket, { order_id: order?.order_id });
      toast.success('Ticket sent to your email!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to generate ticket';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-300 mb-4">Order not found</h2>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-medium"
          >
            Back to Orders
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
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Orders
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Order #{order.order_id}</h1>
                <p className="text-gray-400">
                  Placed on {format(new Date(order.created_at), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {getStatusIcon(order.order_status)}
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.order_status)}`}>
                {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="w-5 h-5 text-primary-400" />
                <p className="text-sm text-gray-400">Order Date</p>
              </div>
              <p className="text-white font-semibold">
                {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Ticket className="w-5 h-5 text-secondary-400" />
                <p className="text-sm text-gray-400">Total Items</p>
              </div>
              <p className="text-white font-semibold">{order.item_count} tickets</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <ShoppingBag className="w-5 h-5 text-accent-400" />
                <p className="text-sm text-gray-400">Total Amount</p>
              </div>
              <p className="text-white font-semibold">KSh {order.total_amount.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Tickets</h2>
          
          {orderItems.length === 0 ? (
            <p className="text-gray-400">No items found for this order.</p>
          ) : (
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-medium">{item.ticket_name}</h3>
                      <p className="text-gray-400 text-sm">{item.event_name}</p>
                      <p className="text-gray-400 text-sm">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        KSh {item.subtotal.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        KSh {item.price_at_purchase.toLocaleString()} each
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Actions */}
        {order.order_status === 'paid' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <button
              onClick={handleDownloadTicket}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200"
            >
              <Download className="w-5 h-5" />
              <span>Download Tickets</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;