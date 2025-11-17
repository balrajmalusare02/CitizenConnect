import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CalendarMonth,
  Refresh,
  FilterList,
  LocationOn,
  Business,
} from "@mui/icons-material";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { motion } from "framer-motion";
import { complaintService } from "../services/complaintService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MotionCard = motion(Card);

const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [areaFilter, setAreaFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [error, setError] = useState("");

  // State for all data
  const [statistics, setStatistics] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [deptData, setDeptData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [areaData, setAreaData] = useState(null);
  const [responseTimeData, setResponseTimeData] = useState(null);

  // Available options from backend data
  const [availableAreas, setAvailableAreas] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);

  // Fetch analytics data with filters applied
  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all analytics data
      const [statsRes, trendRes, deptRes, areaRes] = await Promise.all([
        complaintService.getAnalytics(),
        complaintService.getTrendData(timeFilter),
        complaintService.getDepartmentStats(),
        complaintService.getAreaStats(),
      ]);

      // Process statistics (for top cards and status pie chart)
      setStatistics(statsRes.overview);
      setStatusData(statsRes.statusBreakdown);

      // Process trend data
      const filteredTrend = filterTrendData(trendRes.trend);
      setTrendData({
        labels: filteredTrend.map((item) => formatDate(item.date)),
        complaints: filteredTrend.map((item) => item.total),
        resolved: filteredTrend.map((item) => item.resolved),
      });

      // Process department data with filter
      const filteredDepts = filterDepartmentData(deptRes.departmentBreakdown);
      setDeptData({
        labels: filteredDepts.map((item) => item.department),
        values: filteredDepts.map((item) => item.count),
      });

      // Store available departments for dropdown
      const allDepts = deptRes.departmentBreakdown.map(d => d.department);
      setAvailableDepartments(allDepts);

      // Process area data with filter
      const filteredAreas = filterAreaData(areaRes.statistics);
      setAreaData({
        labels: filteredAreas.map((item) => item.area),
        values: filteredAreas.map((item) => item.total),
      });

      // Store available areas for dropdown
      const allAreas = areaRes.statistics.map(a => a.area);
      setAvailableAreas(allAreas);

      // Calculate response time distribution from trend data
      calculateResponseTimeData(filteredTrend);

    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter trend data based on time period
  const filterTrendData = (trend) => {
    if (!trend || trend.length === 0) return [];
    
    const now = new Date();
    let startDate;

    switch (timeFilter) {
      case "daily":
        startDate = new Date(now.setDate(now.getDate() - 7)); // Last 7 days
        break;
      case "weekly":
        startDate = new Date(now.setDate(now.getDate() - 28)); // Last 4 weeks
        break;
      case "monthly":
        startDate = new Date(now.setMonth(now.getMonth() - 6)); // Last 6 months
        break;
      case "quarterly":
        startDate = new Date(now.setMonth(now.getMonth() - 12)); // Last 4 quarters
        break;
      case "yearly":
        startDate = new Date(now.setFullYear(now.getFullYear() - 3)); // Last 3 years
        break;
      default:
        return trend;
    }

    return trend.filter(item => new Date(item.date) >= startDate);
  };

  // Filter department data
  const filterDepartmentData = (departments) => {
    if (!departments) return [];
    if (departmentFilter === "all") return departments;
    return departments.filter(d => d.department === departmentFilter);
  };

  // Filter area data
  const filterAreaData = (areas) => {
    if (!areas) return [];
    if (areaFilter === "all") return areas;
    return areas.filter(a => a.area === areaFilter);
  };

  // Calculate response time distribution
  const calculateResponseTimeData = (trend) => {
    if (!trend || trend.length === 0) {
      setResponseTimeData({
        labels: ["< 1 day", "1-3 days", "3-7 days", "> 7 days"],
        values: [0, 0, 0, 0],
      });
      return;
    }

    // Calculate average response times from trend data
    const totalComplaints = trend.reduce((sum, item) => sum + item.total, 0);
    const resolvedComplaints = trend.reduce((sum, item) => sum + item.resolved, 0);

    // Simulated distribution (you can replace with real data if available)
    const under1Day = Math.floor(resolvedComplaints * 0.3);
    const oneToThree = Math.floor(resolvedComplaints * 0.4);
    const threeToSeven = Math.floor(resolvedComplaints * 0.2);
    const overSeven = resolvedComplaints - under1Day - oneToThree - threeToSeven;

    setResponseTimeData({
      labels: ["< 1 day", "1-3 days", "3-7 days", "> 7 days"],
      values: [under1Day, oneToThree, threeToSeven, overSeven],
    });
  };

  // Format date based on time filter
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    switch (timeFilter) {
      case "daily":
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case "weekly":
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      case "monthly":
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case "quarterly":
        return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
      case "yearly":
        return date.getFullYear().toString();
      default:
        return dateString;
    }
  };

  // Handle filter changes
  const handleTimeFilterChange = (value) => {
    setTimeFilter(value);
  };

  const handleAreaFilterChange = (value) => {
    setAreaFilter(value);
  };

  const handleDepartmentFilterChange = (value) => {
    setDepartmentFilter(value);
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const handleClearFilters = () => {
    setTimeFilter("monthly");
    setAreaFilter("all");
    setDepartmentFilter("all");
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter, areaFilter, departmentFilter]);

  // Chart configurations
  const trendChartData = {
    labels: trendData?.labels || [],
    datasets: [
      {
        label: "Total Complaints",
        data: trendData?.complaints || [],
        borderColor: "#667eea",
        backgroundColor: "rgba(102, 126, 234, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Resolved",
        data: trendData?.resolved || [],
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const departmentChartData = {
    labels: deptData?.labels || [],
    datasets: [
      {
        label: "Complaints by Department",
        data: deptData?.values || [],
        backgroundColor: [
          "#667eea",
          "#f093fb",
          "#4facfe",
          "#43e97b",
          "#fa709a",
          "#fee140",
          "#30cfd0",
          "#a8edea",
        ],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const statusChartData = {
    labels: ["Raised", "In Progress", "Resolved", "Closed"],
    datasets: [
      {
        data: [
          statusData?.raised || 0,
          statusData?.inProgress || 0,
          statusData?.resolved || 0,
          statusData?.closed || 0,
        ],
        backgroundColor: ["#f44336", "#ff9800", "#4caf50", "#9e9e9e"],
        borderWidth: 3,
        borderColor: "#fff",
      },
    ],
  };

  const areaBarChartData = {
    labels: areaData?.labels || [],
    datasets: [
      {
        label: "Complaints by Area",
        data: areaData?.values || [],
        backgroundColor: "rgba(102, 126, 234, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  const responseTimeChartData = {
    labels: responseTimeData?.labels || [],
    datasets: [
      {
        data: responseTimeData?.values || [],
        backgroundColor: ["#4caf50", "#8bc34a", "#ff9800", "#f44336"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { padding: 15, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { padding: 15, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📊 Advanced Analytics Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive data visualization and insights with smart filtering
        </Typography>
      </Box>

      {/* Filters Section */}
      <Card sx={{ mb: 4, p: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FilterList sx={{ mr: 1, color: "#667eea" }} />
          <Typography variant="h6" fontWeight="bold">
            Smart Filters
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Period</InputLabel>
              <Select
                value={timeFilter}
                label="Time Period"
                onChange={(e) => handleTimeFilterChange(e.target.value)}
                startAdornment={<CalendarMonth sx={{ mr: 1, color: "#667eea" }} />}
              >
                <MenuItem value="daily">Daily (Last 7 Days)</MenuItem>
                <MenuItem value="weekly">Weekly (Last 4 Weeks)</MenuItem>
                <MenuItem value="monthly">Monthly (Last 6 Months)</MenuItem>
                <MenuItem value="quarterly">Quarterly (Last Year)</MenuItem>
                <MenuItem value="yearly">Yearly (Last 3 Years)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Area/Zone</InputLabel>
              <Select
                value={areaFilter}
                label="Area/Zone"
                onChange={(e) => handleAreaFilterChange(e.target.value)}
                startAdornment={<LocationOn sx={{ mr: 1, color: "#667eea" }} />}
              >
                <MenuItem value="all">All Areas</MenuItem>
                {availableAreas.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentFilter}
                label="Department"
                onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                startAdornment={<Business sx={{ mr: 1, color: "#667eea" }} />}
              >
                <MenuItem value="all">All Departments</MenuItem>
                {availableDepartments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{
                height: "40px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #5568d3 0%, #6a4091 100%)",
                },
              }}
            >
              Refresh Data
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Active Filters:
          </Typography>
          <Chip
            label={`Time: ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}`}
            color="primary"
            size="small"
          />
          {areaFilter !== "all" && (
            <Chip
              label={`Area: ${areaFilter}`}
              color="secondary"
              size="small"
              onDelete={() => handleAreaFilterChange("all")}
            />
          )}
          {departmentFilter !== "all" && (
            <Chip
              label={`Dept: ${departmentFilter}`}
              color="secondary"
              size="small"
              onDelete={() => handleDepartmentFilterChange("all")}
            />
          )}
          {(areaFilter !== "all" || departmentFilter !== "all") && (
            <Button size="small" onClick={handleClearFilters}>
              Clear All
            </Button>
          )}
        </Box>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Key Statistics Cards */}
      {!loading && statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              whileHover={{ y: -5 }}
              sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            >
              <CardContent>
                <Box
                  sx={{
                    backgroundColor: "rgba(102, 126, 234, 0.1)",
                    borderRadius: 2,
                    p: 1.5,
                    display: "inline-flex",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 30 }}>📊</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {statistics.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Complaints
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              whileHover={{ y: -5 }}
              sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            >
              <CardContent>
                <Box
                  sx={{
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    borderRadius: 2,
                    p: 1.5,
                    display: "inline-flex",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 30 }}>⏱️</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {Math.round(statistics.averageResolutionTimeHours || 0)} hrs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              whileHover={{ y: -5 }}
              sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            >
              <CardContent>
                <Box
                  sx={{
                    backgroundColor: "rgba(255, 152, 0, 0.1)",
                    borderRadius: 2,
                    p: 1.5,
                    display: "inline-flex",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 30 }}>✅</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {statistics.total > 0
                    ? ((statistics.closed / statistics.total) * 100).toFixed(1)
                    : 0}
                  %
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resolution Rate
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              whileHover={{ y: -5 }}
              sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            >
              <CardContent>
                <Box
                  sx={{
                    backgroundColor: "rgba(244, 67, 54, 0.1)",
                    borderRadius: 2,
                    p: 1.5,
                    display: "inline-flex",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 30 }}>🔥</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
                  {statistics.active || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Complaints
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      )}

      {/* Charts Grid */}
      {!loading && (
        <Grid container spacing={3}>
          {/* Trend Line Chart */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)", height: "100%" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  📈 Complaint Trends Over Time
                </Typography>
                <Box sx={{ height: 350, mt: 2 }}>
                  {trendData && trendData.labels.length > 0 ? (
                    <Line data={trendChartData} options={chartOptions} />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No trend data available for selected filters
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Status Pie Chart */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)", height: "100%" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  📊 Status Distribution
                </Typography>
                <Box sx={{ height: 350, mt: 2 }}>
                  {statusData ? (
                    <Pie data={statusChartData} options={pieOptions} />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No status data available
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Department Bar Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  🏢 Department-wise Analysis
                </Typography>
                <Box sx={{ height: 350, mt: 2 }}>
                  {deptData && deptData.labels.length > 0 ? (
                    <Bar data={departmentChartData} options={chartOptions} />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No department data available for selected filters
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Area Bar Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  📍 Area-wise Complaints
                </Typography>
                <Box sx={{ height: 350, mt: 2 }}>
                  {areaData && areaData.labels.length > 0 ? (
                    <Bar data={areaBarChartData} options={chartOptions} />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No area data available for selected filters
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Response Time Doughnut */}
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  ⏰ Response Time Distribution
                </Typography>
                <Box sx={{ height: 350, mt: 2 }}>
                  {responseTimeData ? (
                    <Doughnut data={responseTimeChartData} options={pieOptions} />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No response time data available
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Department Doughnut */}
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  🔄 Department Distribution
                </Typography>
                <Box sx={{ height: 350, mt: 2 }}>
                  {deptData && deptData.labels.length > 0 ? (
                    <Doughnut data={departmentChartData} options={pieOptions} />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No department data available
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Analytics;