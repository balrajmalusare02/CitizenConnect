import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { Bar } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AreaChart = ({ data }) => {
  const { t } = useTranslation();

  // Prepare chart data
  const chartData = {
    labels: data?.map((d) => d.area) || [],
    datasets: [
      {
        label: t("dashboard.areaChart"),
        data: data?.map((d) => d.count) || [],

        // This is the color enhancement
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
        borderColor: "#ffffff",

        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        ticks: {
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Card sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)", height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          {t("dashboard.areaChart")}
        </Typography>
        <Box sx={{ height: 350, mt: 2 }}>
          {data && data.length > 0 ? (
            <Bar data={chartData} options={options} />
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              mt={10}
            >
              No data available
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AreaChart;
