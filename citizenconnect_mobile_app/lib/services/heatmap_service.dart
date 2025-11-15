import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class HeatmapService {
  final String _baseUrl = "https://citizenconnect-zbfh.onrender.com/api/heatmap";
  final _storage = const FlutterSecureStorage();

  // We need a token to access these routes
  Future<String?> _getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  // Fetches all individual complaint pins
  Future<List<dynamic>> getMapData() async {
    final token = await _getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.get(
      Uri.parse('$_baseUrl/map-data'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body)['points'];
    } else {
      throw Exception('Failed to load map data');
    }
  }

  // Fetches the red/yellow/green density circles
  Future<List<dynamic>> getSeverityZones() async {
    final token = await _getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.get(
      Uri.parse('$_baseUrl/severity-zones'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body)['zones'];
    } else {
      throw Exception('Failed to load severity zones');
    }
  }
}