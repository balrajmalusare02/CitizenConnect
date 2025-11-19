import 'dart:convert';
import 'dart:io'; // Used for File
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/complaint_model.dart';

class ComplaintService {
  final String _baseUrl = "https://citizenconnect-zbfh.onrender.com/api";// Base API URL
  final _storage = const FlutterSecureStorage();

  Future<String?> _getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  // NEW: Function to get user's own complaints ---
  Future<List<Complaint>> getMyComplaints() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/complaints/view'), // Uses GET /api/complaints/view
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token', // Sends the auth token
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final responseBody = jsonDecode(response.body);
        // The backend returns a list inside a 'complaints' key
        final List<dynamic> complaintList = responseBody['complaints'];

        // Map the JSON list to a List<Complaint>
        return complaintList
            .map((json) => Complaint.fromJson(json))
            .toList();
      } else {
        final responseBody = jsonDecode(response.body);
        throw Exception('Failed to load complaints: ${responseBody['message']}');
      }
    } catch (e) {
      print("Error in getMyComplaints: $e");
      throw Exception(e.toString());
    }
  }

  // This function will upload the complaint with an image
  Future<String?> raiseComplaint({
    required String title,
    required String description,
    required String domain,
    required String category,
    double? latitude,
    double? longitude,
    File? imageFile, // This is the new part
  }) async {
    final token = await _getToken();
    if (token == null) return "Not authenticated";

    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/complaints/raise'),
      );

      // Add headers
      request.headers['Authorization'] = 'Bearer $token';

      // Add text fields
      request.fields['title'] = title;
      request.fields['description'] = description;
      request.fields['domain'] = domain;
      request.fields['category'] = category;
      

      // Add location fields if they exist
      if (latitude != null) {
        request.fields['latitude'] = latitude.toString();
      }
      if (longitude != null) {
        request.fields['longitude'] = longitude.toString();
      }

      // Add the image file if it exists
      if (imageFile != null) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'media', // This MUST match your backend: upload.single("media")
            imageFile.path,
          ),
        );
      }

      // Send the request
      var streamedResponse = await request.send().timeout(const Duration(seconds: 20));
      var response = await http.Response.fromStream(streamedResponse);

      final responseBody = jsonDecode(response.body);

      if (response.statusCode == 201) {
        return null; // Success!
      } else {
        return responseBody['message'] ?? 'Failed to raise complaint';
      }
    } catch (e) {
      print("Error in raiseComplaint: $e");
      return e.toString();
    }
  }
}