import { useState, useEffect } from 'react';
import { socket } from '../../socket';
import { useApi } from "../../lib/hooks/use_api";
import { requireLogin } from "../../lib/hooks/require_login";
import { Link } from 'react-router-dom';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const DashboardHome = () => {
  requireLogin();
  const [onlineTutors, setOnlineTutors] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  
  async function fetchUser() {
    const res = await api.get("/api/users/me");
    if (!res.error) {
      setUser(res.user);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUser();
  }, [])

  // Initialize online tutor count
  useEffect(() => {
    const fetchInitialCount = async () => {
      try {
        const response = await fetch('/tutor/online');
        const data = await response.json();
        setOnlineTutors(data.onlineTutors);
      } catch (error) {
        console.error('Failed to fetch initial online tutors count:', error);
      }
    };

    fetchInitialCount();
  }, []);

  // Listen for tutor status updates
  useEffect(() => {
    const handleTutorStatusUpdate = (data: { type: 'increment' | 'decrement' }) => {
      setOnlineTutors(prev => {
        if (data.type === 'increment') {
          return prev + 1;
        } else {
          return Math.max(0, prev - 1);
        }
      });
    };

    socket.on('tutor-status-update', handleTutorStatusUpdate);

    return () => {
      socket.off('tutor-status-update', handleTutorStatusUpdate);
    };
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
            <p className="text-gray-600 mt-2">What would you like to do today?</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-3">
            <span className={`w-3 h-3 rounded-full ${onlineTutors > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></span>
            <span className="text-lg font-semibold">{onlineTutors} Tutors Online</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tutors Card */}
          <Link to="/dashboard/tutors" className="group">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Tutors</h3>
              </div>
              <p className="text-gray-600">Connect with our expert team of tutors for personalized academic support.</p>
            </div>
          </Link>

          {/* Chat Card */}
          <Link to="/dashboard/chat" className="group">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Chat</h3>
              </div>
              <p className="text-gray-600">Collaborate with students across campus through our interactive chat rooms.</p>
            </div>
          </Link>

          {/* AI Assistant Card */}
          <Link to="/dashboard/ai" className="group">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">AI Assistant</h3>
              </div>
              <p className="text-gray-600">Meet VBB - Virtual Big Blue, your AI assistant ready to help with academic questions.</p>
            </div>
          </Link>

          {/* Queue Card */}
          <Link to="/dashboard/queue" className="group">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Queue</h3>
              </div>
              <p className="text-gray-600">Join the tutoring queue to connect with available tutors for immediate assistance.</p>
            </div>
          </Link>

          {/* Profile Card */}
          <Link to="/dashboard/profile" className="group">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Profile</h3>
              </div>
              <p className="text-gray-600">Manage your account settings and update your personal information.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
