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
  const { t } = useTranslation();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapPoints, setMapPoints] = useState([]);
  const [zones, setZones] = useState([]);

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

        setMapPoints(pointsRes.points || []);
        setZones(zonesRes.zones || []);
      } catch (err) {
        console.error('Error fetching map data:', err);
        setError('Failed to load heatmap data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const focusCoords = location.state?.focusLat && location.state?.focusLng 
    ? { lat: location.state.focusLat, lng: location.state.focusLng }
    : null;

  if (loading) return <CenterLoader />;

  return (
    <Box sx={{ height: '85vh', position: 'relative' }}>
       {/* ... (Title and Legend code remains same) ... */}
      
      <Box sx={{ height: '100%', width: '100%', borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
        <MapContainer
          center={focusCoords ? [focusCoords.lat, focusCoords.lng] : [19.8762, 75.3433]} // Use focus or default
          zoom={focusCoords ? 18 : 13} // Zoom in if focused
          style={{ height: '100%', width: '100%' }}
        >
          {/* 3. Add the Focus Handler here inside MapContainer */}
          <MapFocusHandler coords={focusCoords} />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* ... (Rest of your Circles and Markers code remains exactly the same) ... */}
          
        </MapContainer>
      </Box>
    </Box>
  );
};

  if (loading) {
    return <CenterLoader />;
  }

  return (
    <Box sx={{ py: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ px: 4 }}>
        Complaints Heatmap
      </Typography>
      {error && <Alert severity="error" sx={{ mx: 4, mb: 2 }}>{error}</Alert>}
      <Box sx={{ flexGrow: 1, height: '80vh', p: 4 }}>
        <MapContainer 
          center={[20.5937, 78.9629]} // Centered on India
          zoom={5} 
          style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Draw Severity Zones (Circles) */}
          {zones.map((zone) => (
            <Circle
              key={zone.coordinates.lat + zone.coordinates.lng}
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


const CenterLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <CircularProgress />
  </Box>
);

export default Heatmap;