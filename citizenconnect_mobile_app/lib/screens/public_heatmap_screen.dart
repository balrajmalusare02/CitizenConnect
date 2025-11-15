import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart'; // flutter_map's location package
import '../services/heatmap_service.dart';
import 'package:flutter_map_marker_popup/flutter_map_marker_popup.dart';

class PublicHeatmapScreen extends StatefulWidget {
  const PublicHeatmapScreen({Key? key}) : super(key: key);

  @override
  _PublicHeatmapScreenState createState() => _PublicHeatmapScreenState();
}

class _PublicHeatmapScreenState extends State<PublicHeatmapScreen> {
  final HeatmapService _heatmapService = HeatmapService();
  List<dynamic> _mapPoints = [];
  List<dynamic> _zones = [];
  bool _isLoading = true;
  String? _error;

  final PopupController _popupController = PopupController();

  @override
  void initState() {
    super.initState();
    _fetchMapData();
  }

  Future<void> _fetchMapData() async {
    try {
      // Fetch both sets of data in parallel
      final results = await Future.wait([
        _heatmapService.getMapData(),
        _heatmapService.getSeverityZones(),
      ]);

      setState(() {
        _mapPoints = results[0];
        _zones = results[1];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  // Define colors for severity
  Color _getZoneColor(String severity) {
    switch (severity) {
      case 'green': return Colors.green.withOpacity(0.4);
      case 'yellow': return Colors.yellow.withOpacity(0.4);
      case 'orange': return Colors.orange.withOpacity(0.4);
      case 'red': return Colors.red.withOpacity(0.4);
      default: return Colors.blue.withOpacity(0.4);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Public Complaint Map"),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : FlutterMap(
                  options: const MapOptions(
                    // Start centered on Chhatrapati Sambhajinagar
                    initialCenter: LatLng(19.8762, 75.3433),
                    initialZoom: 12.0,
                  ),
                  children: [
                    // Base map layer
                    TileLayer(
                      urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                      subdomains: const ['a', 'b', 'c'],
                    ),

                    // Layer 1: Severity Circles
                    CircleLayer(
                      circles: _zones.map((zone) {
                        return CircleMarker(
                          point: LatLng(zone['coordinates']['lat'], zone['coordinates']['lng']),
                          radius: zone['radius'].toDouble(), // meters
                          useRadiusInMeter: true,
                          color: _getZoneColor(zone['severity']),
                          borderColor: Colors.black26,
                          borderStrokeWidth: 1,
                        );
                      }).toList(),
                    ),

                    // Layer 2: Individual Complaint Pins
                    PopupMarkerLayer(
                      options: PopupMarkerLayerOptions(
                        popupController: _popupController,
                        markers: _mapPoints.map((point) {
                          return Marker(
                            width: 30.0,
                            height: 30.0,
                            point: LatLng(point['coordinates']['lat'], point['coordinates']['lng']),
                            child: const Icon(Icons.location_pin, color: Colors.blue, size: 30),
                          );
                        }).toList(),
                        popupDisplayOptions: PopupDisplayOptions(
                          builder: (BuildContext context, Marker marker) {
                            // Find the complaint data for this marker
                            final point = _mapPoints.firstWhere(
                              (p) => LatLng(p['coordinates']['lat'], p['coordinates']['lng']) == marker.point
                            );

                            // Build the popup UI
                            return Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black26,
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  )
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    point['title'],
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  Text("Status: ${point['status']}"),
                                  Text("Category: ${point['category']}"),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }
}