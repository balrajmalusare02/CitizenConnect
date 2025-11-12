// lib/services/feedback_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class FeedbackService {
  final String _baseUrl = "http://10.0.2.2:4000/api/feedback";
  final _storage = const FlutterSecureStorage();

  Future<String?> _getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  // --- NEW: Function to submit feedback ---
  Future<String?> submitFeedback({
    required int complaintId,
    required int rating,
    String? comment,
  }) async {
    final token = await _getToken();
    if (token == null) return "Not authenticated";

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/complaint/$complaintId'), // POST /api/feedback/complaint/:id
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(<String, dynamic>{
          'rating': rating,
          'comment': comment,
        }),
      ).timeout(const Duration(seconds: 10));

      final responseBody = jsonDecode(response.body);

      if (response.statusCode == 201) {
        return null; // Success!
      } else {
        return responseBody['message'] ?? 'Failed to submit feedback';
      }
    } catch (e) {
      print("Error in submitFeedback: $e");
      return e.toString();
    }
  }
}