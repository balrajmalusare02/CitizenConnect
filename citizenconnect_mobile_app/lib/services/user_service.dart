// lib/services/user_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class UserService {
  final String _baseUrl = "https://citizenconnect-zbfh.onrender.com/api/users";
  final _storage = const FlutterSecureStorage();

  Future<String?> _getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  Future<String> changePassword(String oldPassword, String newPassword) async {
    final token = await _getToken();
    if (token == null) return "Not authenticated";

    final response = await http.put(
      Uri.parse('$_baseUrl/change-password'),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      }),
    );

    final responseBody = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return "Success";
    } else {
      return responseBody['message'] ?? "An error occurred";
    }
  }
}