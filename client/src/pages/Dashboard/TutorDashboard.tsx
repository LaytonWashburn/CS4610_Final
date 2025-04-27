import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';

interface QueueEntry {
    id: number;
    studentId: number;
    subject: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    estimatedTime: number;
}

const TutorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<QueueEntry | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  const { emit, connected } = useSocket([
    {
      event: 'student_assigned',
      handler: (data: QueueEntry) => {
        setCurrentStudent(data);
        setIsAvailable(false);
      }
    },
    {
      event: 'queue_update',
      handler: (data: QueueEntry[]) => {
        setQueue(data);
      }
    }
  ]);

  useEffect(() => {
    if (connected) {
      // Initial queue request
      emit('request_queue', {});
    }
  }, [connected, emit]);

  const handleAvailabilityToggle = () => {
    const newAvailability = !isAvailable;
    setIsAvailable(newAvailability);
    emit('tutor_available', { 
      tutorId: user?.id,
      available: newAvailability 
    });
  };

  const handleCompleteSession = () => {
    if (currentStudent) {
      emit('session_complete', {
        tutorId: user?.id,
        studentId: currentStudent.studentId
      });
      setCurrentStudent(null);
      setIsAvailable(true);
    }
  };

  if (!user?.isTutor) {
    return null;
  }

  return (
    <Card sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'scale(1.02)',
      }
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h5" component="h2">
            Tutor Dashboard
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your tutoring sessions and help students with their questions.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            component={Link}
            to="/tutor/sessions"
            variant="contained"
            color="primary"
            fullWidth
          >
            View Active Sessions
          </Button>
        </Box>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Tutor Dashboard</h1>
            <button
              onClick={handleAvailabilityToggle}
              className={`px-4 py-2 rounded ${
                isAvailable 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-500 hover:bg-gray-600'
              } text-white`}
            >
              {isAvailable ? 'Available' : 'Unavailable'}
            </button>
          </div>

          {currentStudent ? (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Current Session</h2>
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Subject:</span> {currentStudent.subject}
                </div>
                <div>
                  <span className="font-medium">Urgency:</span> 
                  <span className={`ml-2 px-2 py-1 rounded ${
                    currentStudent.urgency === 'HIGH' ? 'bg-red-100 text-red-800' :
                    currentStudent.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {currentStudent.urgency}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Description:</span> {currentStudent.description}
                </div>
                <div>
                  <span className="font-medium">Estimated Time:</span> {currentStudent.estimatedTime} minutes
                </div>
                <button
                  onClick={handleCompleteSession}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Complete Session
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Queue</h2>
              {queue.length === 0 ? (
                <p className="text-gray-500">No students in queue</p>
              ) : (
                <div className="space-y-4">
                  {queue.map((entry) => (
                    <div key={entry.id} className="border p-4 rounded">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Subject:</span> {entry.subject}
                          </div>
                          <div>
                            <span className="font-medium">Urgency:</span>
                            <span className={`ml-2 px-2 py-1 rounded ${
                              entry.urgency === 'HIGH' ? 'bg-red-100 text-red-800' :
                              entry.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {entry.urgency}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Description:</span> {entry.description}
                          </div>
                          <div>
                            <span className="font-medium">Estimated Time:</span> {entry.estimatedTime} minutes
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorDashboard; 