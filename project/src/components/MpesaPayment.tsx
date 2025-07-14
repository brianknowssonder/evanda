import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Phone, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { initiateMpesaPayment } from '../services/api';
import toast from 'react-hot-toast';

interface MpesaPaymentProps {
  amount: number;
  orderId: number;
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

const MpesaPayment: React.FC<MpesaPaymentProps> = ({
  amount,
  orderId,
  onPaymentSuccess,
  onPaymentCancel
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const validatePhoneNumber = (phone: string) => {
    // Remove any spaces or special characters
    const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d]/g, '');
    
    // Check if it's a valid Kenyan number
    if (cleanPhone.startsWith('254') && cleanPhone.length === 12) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      return '254' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
      return '254' + cleanPhone;
    }
    
    return null;
  };

  const handlePayment = async () => {
    const validatedPhone = validatePhoneNumber(phoneNumber);
    
    if (!validatedPhone) {
      toast.error('Please enter a valid Kenyan phone number');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Format phone number for M-Pesa (remove 254 prefix if present)
      let mpesaPhone = validatedPhone;
      if (mpesaPhone.startsWith('254')) {
        mpesaPhone = '0' + mpesaPhone.substring(3);
      }
      
      const response = await initiateMpesaPayment(amount, mpesaPhone, orderId);

      if (response.status === 200 && response.data.message) {
        toast.success('M-Pesa prompt sent to your phone!');
        setPaymentStatus('success');
        
        // Wait for payment confirmation (in production, this would be handled by webhook)
        setTimeout(() => {
          onPaymentSuccess();
        }, 15000); // Give user time to complete M-Pesa transaction
      } else {
        throw new Error('Payment initiation failed');
      }
    } catch (error: any) {
      console.error('M-Pesa payment error:', error);
      const message = error.message || error.response?.data?.error || 'Payment failed. Please try again.';
      toast.error(message);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX XXX XXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">M-Pesa Payment</h2>
        <p className="text-gray-400">Pay securely with M-Pesa</p>
      </div>

      {paymentStatus === 'idle' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-300">Total Amount:</span>
              <span className="text-2xl font-bold text-green-400">
                KSh {amount.toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Order ID: #{orderId}
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
              M-Pesa Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="0712 345 678"
                maxLength={11}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Enter your M-Pesa registered phone number (e.g., 0712345678)
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onPaymentCancel}
              className="flex-1 py-3 px-4 bg-white/10 border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={!phoneNumber || isProcessing}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processing...
                </div>
              ) : (
                `Pay KSh ${amount.toLocaleString()}`
              )}
            </button>
          </div>
        </div>
      )}

      {paymentStatus === 'processing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Processing Payment</h3>
          <p className="text-gray-400 mb-4">
            Please check your phone for the M-Pesa prompt and enter your PIN
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-yellow-300 text-sm">
              You will receive an SMS with a payment request. Enter your M-Pesa PIN to complete the transaction.
            </p>
          </div>
        </motion.div>
      )}

      {paymentStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Payment Initiated</h3>
          <p className="text-gray-400">
            Waiting for payment confirmation...
          </p>
        </motion.div>
      )}

      {paymentStatus === 'failed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Payment Failed</h3>
          <p className="text-gray-400 mb-6">
            There was an issue processing your payment. Please try again.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={onPaymentCancel}
              className="flex-1 py-3 px-4 bg-white/10 border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setPaymentStatus('idle');
                setPhoneNumber('');
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MpesaPayment;