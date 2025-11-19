import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Import L for custom icons
import { complaintService } from '../services/complaintService';

// --- FIX for default Leaflet icon ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
// ----------------------------------

// Define colors for severity
const severityColors = {
  green: 'green',
  yellow: 'yellow',
  orange: 'orange',
  red: 'red',
};

// Helper component to handle map movement
const MapFocusHandler = ({ coords }) => {
  const map = useMap();
  
  useEffect(() => {
    if (coords) {
      // Fly to the location with high zoom (18)
      map.flyTo([coords.lat, coords.lng], 18, {
        duration: 2 // Animation duration in seconds
      });
    }
  }, [coords, map]);

  return null;
};

const Heatmap = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapPoints, setMapPoints] = useState([]); // Initialize as empty array
  const [zones, setZones] = useState([]); // Initialize as empty array

  // --- SAFE STATE HANDLING ---
  // If location.state is null (e.g., opened from sidebar), use empty object
  const state = location.state || {}; 
  const focusCoords = state.focusLat && state.focusLng 
    ? { lat: state.focusLat, lng: state.focusLng }
    : null;
  // --------------------------------------------

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        // Fetch both data points in parallel
        const [pointsRes, zonesRes] = await Promise.all([
          complaintService.getHeatmapData(),
          complaintService.getSeverityZones(),
        ]);

        // Ensure we always set an array, even if backend sends null/undefined
        setMapPoints(Array.isArray(pointsRes) ? pointsRes : []);
        setZones(Array.isArray(zonesRes) ? zonesRes : []);
      } catch (err) {
        console.error('Error loading heatmap data:', err);
        setError('Failed to load heatmap visualization.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <CenterLoader />;

  return (
    <Box sx={{ height: '85vh', position: 'relative' }}>
      {/* Header / Title */}
      <Box sx={{ 
        position: 'absolute', 
        top: 20, 
        right: 20, 
        zIndex: 1000,
        backgroundColor: 'white',
        padding: 2,
        borderRadius: 2,
        boxShadow: 3,
        maxWidth: 300
      }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          City Heatmap
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Visualizing complaint density and severity zones.
        </Typography>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <LegendItem color="green" label="Low Severity" />
          <LegendItem color="yellow" label="Medium Severity" />
          <LegendItem color="orange" label="High Severity" />
          <LegendItem color="red" label="Critical Zone" />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: '100%', width: '100%', borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
        <MapContainer
          center={focusCoords ? [focusCoords.lat, focusCoords.lng] : [19.8762, 75.3433]} // Use focus or default
          zoom={focusCoords ? 18 : 13} // Zoom in if focused
          style={{ height: '100%', width: '100%' }}
        >
          {/* Add the Focus Handler here inside MapContainer */}
          <MapFocusHandler coords={focusCoords} />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Draw Severity Zones (Circles) */}
          {zones.map((zone) => (
            <Circle
              key={`${zone.coordinates.lat}-${zone.coordinates.lng}`}
              center={[zone.coordinates.lat, zone.coordinates.lng]}
              radius={zone.radius}
              pathOptions={{ 
                color: severityColors[zone.severity] || 'blue',
                fillColor: severityColors[zone.severity] || 'blue',
                fillOpacity: 0.4 
              }}
            >
              <Popup>
                <b>Severity: {zone.severity.toUpperCase()}</b><br />
                Complaints: {zone.complaintCount}
              </Popup>
            </Circle>
          ))}

          {/* Draw Individual Complaint Pins (Markers) */}
          {mapPoints.map((point) => (
            <Marker 
              key={point.id} 
              position={[point.coordinates.lat, point.coordinates.lng]}
            >
              <Popup>
                <b>{point.title} (ID: {point.id})</b><br />
                Status: {point.status}<br />
                Category: {point.category}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Box>
  );
};

const LegendItem = ({ color, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: color }} />
    <Typography variant="caption">{label}</Typography>
  </Box>
);

const CenterLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <CircularProgress />
  </Box>
);

export default Heatmap;