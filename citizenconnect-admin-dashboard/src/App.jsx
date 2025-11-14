// src/App.jsx

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import { authService } from './services/authService';
import './i18n'; // Import i18n configuration

// Import the new dashboards
import EmployeeDashboard from './pages/EmployeeDashboard';
import WardOfficerDashboard from './pages/WardOfficerDashboard';
import DeptAdminDashboard from './pages/DeptAdminDashboard';

// Your teammate's theme (I'm copying it from your file)
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3f51b5' },
    secondary: { main: '#f50057' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
    text: { primary: '#111827', secondary: '#6b7285' },
  },
  // ... (rest of your theme config)
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      setUserRole(authService.getUserRole());
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setUserRole(authService.getUserRole());
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!isAuthenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <DashboardRouter role={userRole} />
      )}
    </ThemeProvider>
  );
}

// This is the new "Global Router" component
const DashboardRouter = ({ role }) => {
  switch (role) {
    case 'CITY_ADMIN':
    case 'SUPER_ADMIN':
    case 'MAYOR':
      // For high-level admins, show the full AppLayout
      return <AppLayout userRole={role} />;

    case 'DEPARTMENT_ADMIN':
      // TODO: We need to build a layout for this
      return <AppLayout userRole={role} />;

    case 'DEPARTMENT_EMPLOYEE':
      // TODO: We need to build a layout for this
      return <AppLayout userRole={role} />;

    case 'WARD_OFFICER':
      // TODO: We need to build a layout for this
      return <AppLayout userRole={role} />;

    default:
      // If role is CITIZEN or unknown, log them out
      authService.logout();
      return <Login />;
  }
};

export default App;