import React, { useState } from 'react';
import { Box, Toolbar, Container } from '@mui/material';
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

const AppLayout = ({ userRole }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
      return <Complaints />;
    case 'analytics':
      return <Analytics />;
    case 'heatmap':
      return <Heatmap />;
    default:
      return <Dashboard onPageChange={handlePageChange} />;
  }
};

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Header is now added */}
      <Header />
      
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