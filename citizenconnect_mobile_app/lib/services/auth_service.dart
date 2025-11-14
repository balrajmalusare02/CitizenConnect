import 'dart:convert';
import 'dart:async'; // Import this for timeout
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'socket_service.dart';

class AuthService {
  // Use 10.0.2.2 for the Android Emulator
  final String _baseUrl = "https://citizenconnect-zbfh.onrender.com/api/auth";
  final _storage = const FlutterSecureStorage();

  // --- NEW, IMPROVED LOGIN FUNCTION ---
  Future<String?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/login'),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 10)); // <-- Added a 10-second timeout

      final responseBody = jsonDecode(response.body);

      if (response.statusCode == 200) {
        String token = responseBody['data']['token'];
        await _storage.write(key: 'jwt_token', value: token);
        SocketService().connect();
        return null; // No error
      } else {
        return responseBody['message']; // Return error from backend
      }
    } catch (e) {
      // This will catch network errors like "Connection timed out"
      print("Error in login: $e"); // <-- This prints to your Debug Console
      if (e is TimeoutException) {
        return "Connection timed out. Is the server running?";
      }
      return e.toString(); // Return the error to the screen
    }
  }

  // --- NEW, IMPROVED REGISTER FUNCTION ---
  Future<String?> register(String name, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/register'),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode(<String, String>{
          'name': name,
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 10)); // <-- Added a 10-second timeout

      final responseBody = jsonDecode(response.body);

      if (response.statusCode == 201) {
        String token = responseBody['data']['token'];
        await _storage.write(key: 'jwt_token', value: token);
        SocketService().connect();
        return null; // No error
      } else {
        return responseBody['message']; // Return error from backend
      }
    } catch (e) {
      // This will catch network errors
      print("Error in register: $e"); // <-- This prints to your Debug Console
      if (e is TimeoutException) {
        return "Connection timed out. Is the server running?";
      }
      return e.toString(); // Return the error to the screen
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: 'jwt_token');
    SocketService().connect();
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt_token');
    
  }
}