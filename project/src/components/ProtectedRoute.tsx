import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  // Always allow access - no authentication required
  return <>{children}</>;
};

export default ProtectedRoute;