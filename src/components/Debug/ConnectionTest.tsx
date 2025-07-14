import React, { useState } from 'react';
import { apiService, API_BASE_URL } from '../../services/api';
import { Wifi,  CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ConnectionTest: React.FC = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
    details?: any;
  }>({ status: 'idle', message: 'Click to test connection' });

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus({ status: 'testing', message: 'Testing connection...' });

    try {
      // Test basic connectivity
      const healthResponse = await apiService.healthCheck();
      
      if (healthResponse.status === 200) {
        setConnectionStatus({
          status: 'success',
          message: 'Connection successful!',
          details: healthResponse
        });
      } else {
        setConnectionStatus({
          status: 'error',
          message: 'Backend responded but not healthy',
          details: healthResponse
        });
      }
    } catch (error: any) {
      setConnectionStatus({
        status: 'error',
        message: `Connection failed: ${error.message}`,
        details: {
          error: error.message,
          baseUrl: API_BASE_URL,
          suggestion: 'Make sure your backend server is running on the correct port'
        }
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'testing':
        return <AlertCircle className="h-5 w-5 text-yellow-600 animate-pulse" />;
      default:
        return <Wifi className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'testing':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Backend Connection Test</h3>
        <button
          onClick={testConnection}
          disabled={isTestingConnection}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTestingConnection ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Testing...
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              Test Connection
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Backend URL:</span>
          <code className="text-sm bg-gray-200 px-2 py-1 rounded">{API_BASE_URL}</code>
        </div>

        <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center">
            {getStatusIcon()}
            <span className="ml-2 font-medium">{connectionStatus.message}</span>
          </div>
          
          {connectionStatus.details && (
            <div className="mt-3">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium">View Details</summary>
                <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-auto">
                  {JSON.stringify(connectionStatus.details, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {connectionStatus.status === 'error' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Troubleshooting Tips:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Make sure your Flask backend is running: <code>python backend/app.py</code></li>
              <li>• Check that the backend is running on port 5002</li>
              <li>• Verify the API_BASE_URL in <code>src/config/api.ts</code></li>
              <li>• Check browser console for CORS errors</li>
              <li>• Ensure your firewall allows connections to port 5002</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionTest;