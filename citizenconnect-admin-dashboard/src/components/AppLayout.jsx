import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Toolbar, Container, Typography } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header'; // Import Header
import Footer from './Footer'; // Import Footer
import Dashboard from '../pages/Dashboard';
import Complaints from '../pages/Complaints';
import Analytics from '../pages/Analytics';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import WardOfficerDashboard from '../pages/WardOfficerDashboard';
import DeptAdminDashboard from '../pages/DeptAdminDashboard';
import Heatmap from '../pages/Heatmap';
import Profile from '../pages/Profile';
import Feedback from '../pages/Feedback';

const AppLayout = ({ userRole }) => {
  const location = useLocation();
  useEffect(() => {
    // Sync sidebar with current URL
    const path = location.pathname.replace('/', '').toLowerCase();
    const validPages = ['dashboard', 'complaints', 'analytics', 'heatmap', 'profile', 'feedback'];
    if (validPages.includes(path)) {
      setCurrentPage(path);
    }
  }, [location]);
  
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [initialFilter, setInitialFilter] = useState(null);

  const handlePageChange = (page, filter = null) => {
    setCurrentPage(page);
    setInitialFilter(filter);
  };

  const renderPage = () => {
  // If user is an Employee, ONLY show their dashboard
  if (userRole === 'DEPARTMENT_EMPLOYEE') {
    return <EmployeeDashboard />;
  }

  if (userRole === 'WARD_OFFICER') {
    return <WardOfficerDashboard />;
  }

  if (userRole === 'DEPARTMENT_ADMIN') {
    // Dept Admins will use the "dashboard" link for their dashboard
    // and "complaints" for the full list
    if (currentPage === 'dashboard') {
      return <DeptAdminDashboard />;
    }
    if (currentPage === 'complaints') {
      return <Complaints />;
    }
    // Dept Admins don't see city-wide analytics
    return <DeptAdminDashboard />; 
  }

  // Otherwise, use the normal navigation for admins
  switch (currentPage) {
    case 'dashboard':
      return <Dashboard onPageChange={handlePageChange} />;
    case 'complaints':
      return <Complaints initialFilter = {initialFilter}/>;
    case 'analytics':
      return <Analytics />;
    case 'heatmap':
      return <Heatmap />;
    case 'profile':
      return <Profile />;
    case 'feedback':
        return (<Feedback />);
    default:
      return <Dashboard onPageChange={handlePageChange} />;
  }
};

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Header is now added */}
      <Header onPageChange={handlePageChange} />
      
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} userRole={userRole} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          overflow: 'auto',
          // Use flexbox to make the Footer stick to the bottom
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* This Toolbar acts as a spacer for the fixed Header */}
        <Toolbar /> 
        
        {/* This Container holds the page content */}
        <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
          {renderPage()}
        </Container>
        
        {/* Footer is now added */}
        <Footer />
      </Box>
    </Box>
  );
};

export default AppLayout;