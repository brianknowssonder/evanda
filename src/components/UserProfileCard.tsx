import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  X,
  Phone,
  MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface UserProfileCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: ''
  });

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update user data
      // await api.put(`/users/${user.id}`, editData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      location: ''
    });
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'organizer':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'customer':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full platform administration access';
      case 'organizer':
        return 'Can create and manage events';
      case 'customer':
        return 'Can browse and book events';
      default:
        return 'Standard user access';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">User Profile</h2>
          <div className="flex space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Picture */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-white" />
          </div>
          
          {/* Role Badge */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
            <Shield className="w-3 h-3 mr-1" />
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
          <p className="text-xs text-gray-400 mt-1">{getRoleDescription(user.role)}</p>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          {/* Name */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-400">Full Name</p>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-white font-medium">{user.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-400">Email Address</p>
            </div>
            {isEditing ? (
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-white font-medium">{user.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-400">Phone Number</p>
            </div>
            {isEditing ? (
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="0712345678"
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-white font-medium">{editData.phone || 'Not provided'}</p>
            )}
          </div>

          {/* Location */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-400">Location</p>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Nairobi, Kenya"
                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-white font-medium">{editData.location || 'Not provided'}</p>
            )}
          </div>

          {/* Member Since */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-400">Member Since</p>
            </div>
            <p className="text-white font-medium">
              {format(new Date(), 'MMMM dd, yyyy')}
            </p>
          </div>

          {/* User ID */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-400">User ID</p>
            </div>
            <p className="text-white font-medium">#{user.id}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 border border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-200"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default UserProfileCard;