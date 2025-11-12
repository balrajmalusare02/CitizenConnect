// lib/services/notification_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http; // <-- CORRECT
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/notification_model.dart';

class NotificationService {
  final String _baseUrl = "http://10.0.2.2:4000/api/notifications";
  final _storage = const FlutterSecureStorage();

  Future<String?> _getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  // --- NEW: Function to get all notifications ---
  Future<List<NotificationModel>> getMyNotifications() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    try {
      final response = await http.get(
        Uri.parse(_baseUrl), // GET /api/notifications
        headers: <String, String>{
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final responseBody = jsonDecode(response.body);
        final List<dynamic> notifList = responseBody['notifications'];
        return notifList.map((json) => NotificationModel.fromJson(json)).toList();
      } else {
        final responseBody = jsonDecode(response.body);
        throw Exception('Failed to load notifications: ${responseBody['message']}');
      }
    } catch (e) {
      print("Error in getMyNotifications: $e");
      throw Exception(e.toString());
    }
  }

  // --- NEW: Function to mark a notification as read ---
  Future<void> markAsRead(int notificationId) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/$notificationId/read'), // PUT /api/notifications/:id/read
        headers: <String, String>{
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode != 200) {
        final responseBody = jsonDecode(response.body);
        throw Exception('Failed to mark as read: ${responseBody['message']}');
      }
      // No return needed, just success
    } catch (e) {
      print("Error in markAsRead: $e");
      throw Exception(e.toString());
    }
  }
}