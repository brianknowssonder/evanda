import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Calendar, 
  Users, 
  Shield, 
  Zap, 
  Star, 
  Ticket, 
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import QuickLinks from '../components/QuickLinks';

const Home: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Calendar,
      title: 'Event Discovery',
      description: 'Find amazing events happening around you with our intelligent recommendation system.',
      gradient: 'from-blue-500 to-cyan-400'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Industry-leading security with M-Pesa integration and encrypted transactions.',
      gradient: 'from-green-500 to-emerald-400'
    },
    {
      icon: Ticket,
      title: 'Smart Tickets',
      description: 'QR-coded digital tickets with real-time validation and fraud protection.',
      gradient: 'from-purple-500 to-pink-400'
    },
    {
      icon: Users,
      title: 'Event Management',
      description: 'Comprehensive tools for organizers to create, manage, and track their events.',
      gradient: 'from-orange-500 to-red-400'
    }
  ];

  const stats = [
    { label: 'Events Created', value: '50K+', icon: Calendar },
    { label: 'Happy Customers', value: '200K+', icon: Users },
    { label: 'Tickets Sold', value: '1M+', icon: Ticket },
    { label: 'Success Rate', value: '99.9%', icon: TrendingUp }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium"
            >
              <Star className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                #1 Event Ticketing Platform
              </span>
            </motion.div>

            <div className="space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight"
              >
                <span className="bg-gradient-to-r from-white via-primary-200 to-secondary-200 bg-clip-text text-transparent">
                  Unforgettable
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent">
                  Events Await
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                Discover amazing events, connect with your community, and create memories that last a lifetime with EVANDA's premium ticketing platform.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link
                to="/events"
                className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/25"
              >
                <span className="flex items-center">
                  Explore Events
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400 to-secondary-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </Link>

              {!user && (
                <Link
                  to="/register"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                >
                  Get Started Free
                </Link>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="text-center group"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                    <stat.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          >
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2"></div>
          </motion.div>
        </motion.div>
      </section>

      {/* Quick Links Section - Only show for logged in users */}
      {user && (
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  Welcome back, {user.name}!
                </span>
              </h2>
              <p className="text-xl text-gray-300">
                Quick access to your most used features
              </p>
            </motion.div>

            <QuickLinks />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                Why Choose EVANDA?
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of event ticketing with our cutting-edge platform designed for both event-goers and organizers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -10 }}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                
                {/* Hover effect overlay */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 backdrop-blur-sm border border-white/10 rounded-3xl p-12 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 right-4 w-20 h-20 bg-primary-500/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-4 left-4 w-32 h-32 bg-secondary-500/20 rounded-full blur-2xl"></div>
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center px-4 py-2 bg-accent-500/20 rounded-full mb-6"
              >
                <Zap className="w-4 h-4 text-accent-400 mr-2" />
                <span className="text-accent-400 font-medium">Ready to Get Started?</span>
              </motion.div>

              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Join thousands of event lovers
              </h3>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Create your account today and discover amazing events in your area. It's free and takes less than a minute!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {!user ? (
                  <>
                    <Link
                      to="/register"
                      className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/25"
                    >
                      <span className="flex items-center">
                        Create Free Account
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>

                    <Link
                      to="/events"
                      className="px-8 py-4 border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
                    >
                      Browse Events
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/25"
                  >
                    <span className="flex items-center">
                      Go to Dashboard
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;