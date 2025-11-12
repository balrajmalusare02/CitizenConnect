// lib/services/status_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/complaint_detail_model.dart'; // Import our new model

class StatusService {
  final String _baseUrl = "http://10.0.2.2:4000/api/status"; // API URL for status
  final _storage = const FlutterSecureStorage();

  Future<String?> _getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  // --- NEW: Function to get a complaint's detailed history ---
  Future<ComplaintDetails> getComplaintHistory(int complaintId) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/complaint/$complaintId/history'), // GET /api/status/complaint/:id/history
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final responseBody = jsonDecode(response.body);
        // Map the JSON to our ComplaintDetails model
        return ComplaintDetails.fromJson(responseBody);
      } else {
        final responseBody = jsonDecode(response.body);
        throw Exception('Failed to load history: ${responseBody['message']}');
      }
    } catch (e) {
      print("Error in getComplaintHistory: $e");
      throw Exception(e.toString());
    }
  }
}