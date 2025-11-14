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
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  Refresh,
  FilterList,
  LocationOn,
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

  // Sample data - Replace with actual API calls
  const [statistics, setStatistics] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [deptData, setDeptData] = useState(null);
  const [statusData, setStatusData] = useState(null); // For the pie chart
  const [areaData, setAreaData] = useState(null);

  // We'll leave this one as sample data for now
  const [responseTimeData] = useState({
    labels: ["< 1 day", "1-3 days", "3-7 days", "> 7 days"],
    values: [40, 60, 35, 15],
  });

  // ... in Analytics.jsx

  // Fetch data based on filters
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      console.log("Fetching with filters:", {
        timeFilter,
        areaFilter,
        departmentFilter,
      });

      // Call all our real endpoints in parallel
      const [statsRes, trendRes, deptRes, areaRes] = await Promise.all([
        complaintService.getAnalytics(), // <-- NEW: Get stats for cards
        complaintService.getTrendData(timeFilter),
        complaintService.getDepartmentStats(),
        complaintService.getAreaStats(),
      ]);

      // --- Translate Stats Data (for cards and status chart) ---
      // Backend: { overview: {...}, statusBreakdown: {...} }
      setStatistics(statsRes.overview);
      setStatusData(statsRes.statusBreakdown);

      // --- Translate Trend Data ---
      setTrendData({
        labels: trendRes.trend.map((item) => item.date),
        complaints: trendRes.trend.map((item) => item.total),
        resolved: trendRes.trend.map((item) => item.resolved),
      });

      // --- Translate Department Data ---
      setDeptData({
        labels: deptRes.departmentBreakdown.map((item) => item.department),
        values: deptRes.departmentBreakdown.map((item) => item.count),
      });

      // --- Translate Area Data ---
      setAreaData({
        labels: areaRes.statistics.map((item) => item.area),
        values: areaRes.statistics.map((item) => item.total),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };
  // ...

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      },
      {
        label: "Resolved",
        data: trendData?.resolved || [],
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        fill: true,
        tension: 0.4,
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
        ],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const statusChartData = {
    labels: ["Pending", "Under Review", "Resolved", "Closed"],
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
  labels: responseTimeData.labels, // <-- FIX
  datasets: [
    {
      data: responseTimeData.values, // <-- FIX
      backgroundColor: ['#4caf50', '#8bc34a', '#ff9800', '#f44336'],
      borderWidth: 2,
      borderColor: '#fff',
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
          Comprehensive data visualization and insights
        </Typography>
      </Box>

      {/* Filters Section */}
      <Card sx={{ mb: 4, p: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FilterList sx={{ mr: 1, color: "#667eea" }} />
          <Typography variant="h6" fontWeight="bold">
            Filters & Controls
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
                onChange={(e) => setTimeFilter(e.target.value)}
                startAdornment={
                  <CalendarMonth sx={{ mr: 1, color: "#667eea" }} />
                }
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Area/Zone</InputLabel>
              <Select
                value={areaFilter}
                label="Area/Zone"
                onChange={(e) => setAreaFilter(e.target.value)}
                startAdornment={<LocationOn sx={{ mr: 1, color: "#667eea" }} />}
              >
                <MenuItem value="all">All Areas</MenuItem>
                <MenuItem value="sector21">Sector 21</MenuItem>
                <MenuItem value="sector15">Sector 15</MenuItem>
                <MenuItem value="downtown">Downtown</MenuItem>
                <MenuItem value="sector18">Sector 18</MenuItem>
                <MenuItem value="sector25">Sector 25</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentFilter}
                label="Department"
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <MenuItem value="all">All Departments</MenuItem>
                <MenuItem value="water">Water</MenuItem>
                <MenuItem value="electricity">Electricity</MenuItem>
                <MenuItem value="road">Road</MenuItem>
                <MenuItem value="sewage">Sewage</MenuItem>
                <MenuItem value="garbage">Garbage</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchAnalytics}
              disabled={loading}
              sx={{
                height: "40px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #5568d3 0%, #6a4091 100%)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Refresh"
              )}
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={`Time: ${
              timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)
            }`}
            color="primary"
            size="small"
          />
          {areaFilter !== "all" && (
            <Chip
              label={`Area: ${areaFilter}`}
              color="secondary"
              size="small"
              onDelete={() => setAreaFilter("all")}
            />
          )}
          {departmentFilter !== "all" && (
            <Chip
              label={`Dept: ${departmentFilter}`}
              color="secondary"
              size="small"
              onDelete={() => setDepartmentFilter("all")}
            />
          )}
        </Box>
      </Card>

      {/* Key Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MotionCard
            whileHover={{ y: -5 }}
            sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
          >
            <CardContent>
              {/* ... icon box ... */}
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                {statistics?.total || 0}
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
              {/* ... icon box ... */}
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                {statistics?.averageResolutionTimeHours || 0} hrs
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
              {/* ... icon box ... */}
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                {(
                  ((statistics?.closed || 0) / (statistics?.total || 1)) *
                  100
                ).toFixed(0)}
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
              {/* ... icon box ... */}
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                {statistics?.active || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Complaints
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Trend Line Chart */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)", height: "100%" }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📈 Complaint Trends Over Time
              </Typography>
              <Box sx={{ height: 350, mt: 2 }}>
                <Line data={trendChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)", height: "100%" }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📊 Status Distribution
              </Typography>
              <Box sx={{ height: 350, mt: 2 }}>
                <Pie data={statusChartData} options={chartOptions} />
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
                <Bar data={departmentChartData} options={chartOptions} />
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
                <Bar data={areaBarChartData} options={chartOptions} />
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
                <Doughnut data={responseTimeChartData} options={chartOptions} />
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
                <Doughnut data={departmentChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
