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
      itemCount: complaints.length,
      itemBuilder: (context, index) {
        final complaint = complaints[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ListTile(
            title: Text(complaint.title, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(complaint.domain, overflow: TextOverflow.ellipsis),
            trailing: Text(
              complaint.status,
              style: TextStyle(
                color: _getStatusColor(complaint.status),
                fontWeight: FontWeight.bold,
              ),
            ),
            // We will add an onTap later to go to the detail page (Step 6.1.6)
            onTap: () {
              Navigator.of(context).pushNamed(
                '/complaint-detail',
                arguments: complaint.id, // Pass the complaint ID as an argument
              );
            },
          ),
        );
      },
    );
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