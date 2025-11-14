import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class DomainService {
  final String _baseUrl = "http://10.0.2.2:4000/api"; // Base API URL
  final _storage = const FlutterSecureStorage();

  // Fetches the JWT token from storage
  Future<String?> _getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  // Fetches the domains and categories from your backend
  Future<Map<String, dynamic>> getDomains() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/domains'),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token', // <-- Send the token!
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Your backend sends data in a 'data' object
        return data['data'] as Map<String, dynamic>;
      } else {
        throw Exception('Failed to load domains: ${response.body}');
      }
    } catch (e) {
      print("Error fetching domains: $e");
      throw Exception('Error fetching domains: $e');
    }
  }
}