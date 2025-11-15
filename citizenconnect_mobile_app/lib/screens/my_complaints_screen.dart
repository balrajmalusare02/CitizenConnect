// lib/screens/my_complaints_screen.dart

import 'package:flutter/material.dart';
import '../models/complaint_model.dart';
import '../services/complaint_service.dart';
import '../services/socket_service.dart';

class MyComplaintsScreen extends StatefulWidget {
  const MyComplaintsScreen({super.key});

  @override
  _MyComplaintsScreenState createState() => _MyComplaintsScreenState();

}

class _MyComplaintsScreenState extends State<MyComplaintsScreen> {
  final ComplaintService _complaintService = ComplaintService();
  late Future<List<Complaint>> _complaintsFuture;

  @override
  void initState() {
    super.initState();
    // Start fetching complaints as soon as the page loads
    _complaintsFuture = _complaintService.getMyComplaints();
    // --- START LISTENING ---
    SocketService().onComplaintStatusUpdated((data) {
      print("📢 Real-time update received: $data");

      // Refresh the list automatically!
      setState(() {
        _complaintsFuture = _complaintService.getMyComplaints();
      });

      // Optional: Show a small snackbar
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("A complaint status was just updated!"),
          backgroundColor: Colors.blue,
          duration: Duration(seconds: 2),
        ),
      );
    });
  }

  @override
  void dispose() {
    // Stop listening to avoid memory leaks
    SocketService().removeAllListeners();
    super.dispose();
  }

  // Helper to build the list
  Widget _buildComplaintList(List<Complaint> complaints) {
    if (complaints.isEmpty) {
      return const Center(
        child: Text(
          "You have not submitted any complaints yet.",
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8.0), // Add padding
      itemCount: complaints.length,
      itemBuilder: (context, index) {
        final complaint = complaints[index];
        return Card( // Use a Card
          elevation: 3,
          margin: const EdgeInsets.symmetric(vertical: 8.0),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: Icon(_getStatusIcon(complaint.status), color: _getStatusColor(complaint.status)),
            title: Text(complaint.title, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(
              "${complaint.domain} - ${complaint.category}",
              overflow: TextOverflow.ellipsis,
            ),
            trailing: Chip( // Use a Chip for status
              label: Text(
                complaint.status,
                style: const TextStyle(color: Colors.white),
              ),
              backgroundColor: _getStatusColor(complaint.status),
            ),
            onTap: () {
              Navigator.of(context).pushNamed(
                '/complaint-detail',
                arguments: complaint.id,
              );
            },
          ),
        );
      },
    );
  }

  // --- NEW: Helper function for icons ---
  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'Raised':
        return Icons.flag;
      case 'Acknowledged':
        return Icons.visibility;
      case 'InProgress':
        return Icons.sync;
      case 'Resolved':
        return Icons.check_circle;
      case 'Closed':
        return Icons.done_all;
      default:
        return Icons.help;
    }
  }

  // Helper to give status a color
  Color _getStatusColor(String status) {
    switch (status) {
      case 'Raised':
        return Colors.orange;
      case 'Acknowledged':
        return Colors.blue;
      case 'InProgress':
        return Colors.purple;
      case 'Resolved':
        return Colors.green;
      case 'Closed':
        return Colors.grey;
      default:
        return Colors.black;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Complaints"),
      ),
      body: FutureBuilder<List<Complaint>>(
        future: _complaintsFuture,
        builder: (context, snapshot) {
          // Case 1: Still loading
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          // Case 2: Error
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  "Error: ${snapshot.error}",
                  style: const TextStyle(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          // Case 3: Success
          if (snapshot.hasData) {
            return _buildComplaintList(snapshot.data!);
          }

          // Default case
          return const Center(child: Text("No data found."));
        },
      ),
    );
  }
}