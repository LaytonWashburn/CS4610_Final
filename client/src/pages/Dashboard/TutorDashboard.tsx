import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../../contexts/AuthContext';

const TutorDashboard: React.FC = () => {
  const { user } = useAuth();

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
      </CardContent>
    </Card>
  );
};

export default TutorDashboard; 