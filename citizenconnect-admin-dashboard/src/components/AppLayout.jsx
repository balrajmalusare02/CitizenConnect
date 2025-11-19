import React, { useState } from 'react';
import { Box, Toolbar, Container } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header'; 
import Footer from './Footer'; 
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
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [initialFilter, setInitialFilter] = useState(null);
  
  // State to pass heatmap focus data
  const [heatmapFocus, setHeatmapFocus] = useState(null);

  const handlePageChange = (page, filter = null, focusData = null) => {
    setCurrentPage(page);
    setInitialFilter(filter);
    
    // If navigating to heatmap with focus data, store it
    if (page === 'heatmap' && focusData) {
      setHeatmapFocus(focusData);
    }
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
      if (currentPage === 'dashboard') return <DeptAdminDashboard />;
      if (currentPage === 'complaints') return <Complaints />;
      return <DeptAdminDashboard />; 
    }

    // Otherwise, use the normal navigation for admins
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={handlePageChange} />;
      case 'complaints':
        return <Complaints initialFilter={initialFilter} onPageChange={handlePageChange} />;
      case 'analytics':
        return <Analytics />;
      case 'heatmap':
        return <Heatmap focusData={heatmapFocus} />;
      case 'profile':
        return <Profile />;
      case 'feedback':
        return <Feedback />;
      default:
        return <Dashboard onPageChange={handlePageChange} />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onPageChange={handlePageChange} />
      
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} userRole={userRole} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar /> 
        
        <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
          {renderPage()}
        </Container>
        
        <Footer />
      </Box>
    </Box>
  );
};

export default AppLayout;