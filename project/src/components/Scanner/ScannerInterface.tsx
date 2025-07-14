import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scan, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { api, endpoints } from '../../services/api';
import { ValidationResult } from '../../types';
import toast from 'react-hot-toast';

const ScannerInterface: React.FC = () => {
  const [qrCode, setQrCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleScan = async () => {
    if (!qrCode.trim()) {
      toast.error('Please enter a QR code');
      return;
    }

    try {
      setIsScanning(true);
      const response = await apiService.validateTicket({
        qr_data: qrCode,
        scanner_id: 'web-scanner' // Default scanner ID for web interface
      });
      
      setValidationResult(response.data);
      
      if (response.data.valid) {
        toast.success('Ticket validated successfully!');
      } else {
        toast.error(response.data.reason || 'Invalid ticket');
      }
    } catch (error: any) {
      const message = error.message || error.response?.data?.reason || 'Validation failed';
      toast.error(message);
      setValidationResult({
        valid: false,
        reason: message
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setQrCode('');
    setValidationResult(null);
  };

  const getResultIcon = () => {
    if (!validationResult) return null;
    
    if (validationResult.valid) {
      return <CheckCircle className="w-16 h-16 text-green-400" />;
    } else {
      return <XCircle className="w-16 h-16 text-red-400" />;
    }
  };

  const getResultColor = () => {
    if (!validationResult) return '';
    
    return validationResult.valid 
      ? 'border-green-500/30 bg-green-500/10' 
      : 'border-red-500/30 bg-red-500/10';
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
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
              <Scan className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Ticket Scanner</h1>
          </div>
          <p className="text-gray-400 text-lg">Scan QR codes to validate event tickets</p>
        </motion.div>

        {/* Scanner Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
        >
          {!validationResult ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Scan className="w-12 h-12 text-primary-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Scan Ticket QR Code</h2>
                <p className="text-gray-400">Enter the QR code data to validate the ticket</p>
              </div>

              <div className="max-w-md mx-auto">
                <label htmlFor="qrCode" className="block text-sm font-medium text-gray-300 mb-2">
                  QR Code Data
                </label>
                <textarea
                  id="qrCode"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Paste QR code data here..."
                />
              </div>

              <div className="text-center">
                <button
                  onClick={handleScan}
                  disabled={isScanning || !qrCode.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {isScanning ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Validating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Scan className="w-6 h-6 mr-2" />
                      Validate Ticket
                    </div>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-center p-8 border-2 rounded-2xl ${getResultColor()}`}
            >
              <div className="flex justify-center mb-6">
                {getResultIcon()}
              </div>

              <h2 className={`text-2xl font-bold mb-4 ${
                validationResult.valid ? 'text-green-400' : 'text-red-400'
              }`}>
                {validationResult.valid ? 'Valid Ticket' : 'Invalid Ticket'}
              </h2>

              {validationResult.valid ? (
                <div className="space-y-4 text-left max-w-md mx-auto">
                  {validationResult.event && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-sm text-gray-400">Event</p>
                      <p className="text-white font-semibold">{validationResult.event}</p>
                    </div>
                  )}
                  
                  {validationResult.user && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-sm text-gray-400">Ticket Holder</p>
                      <p className="text-white font-semibold">{validationResult.user}</p>
                    </div>
                  )}
                  
                  {validationResult.scanned_at && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-sm text-gray-400">Scanned At</p>
                      <p className="text-white font-semibold">{validationResult.scanned_at}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-4 max-w-md mx-auto">
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">Reason</p>
                  </div>
                  <p className="text-white mt-2">{validationResult.reason}</p>
                </div>
              )}

              <button
                onClick={handleReset}
                className="mt-8 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Scan Another Ticket
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <h4 className="text-white font-medium mb-2">How to scan:</h4>
              <ul className="space-y-1">
                <li>• Use a QR code scanner app to read the ticket</li>
                <li>• Copy the QR code data</li>
                <li>• Paste it in the input field above</li>
                <li>• Click "Validate Ticket"</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Validation results:</h4>
              <ul className="space-y-1">
                <li>• <span className="text-green-400">Green</span> = Valid ticket</li>
                <li>• <span className="text-red-400">Red</span> = Invalid/Used ticket</li>
                <li>• Check event details carefully</li>
                <li>• Report any issues to admin</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ScannerInterface;