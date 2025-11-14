// lib/screens/complaint_detail_screen.dart

import 'package:flutter/material.dart';
import '../models/complaint_detail_model.dart';
import '../services/status_service.dart';
import '../services/feedback_service.dart';

class ComplaintDetailScreen extends StatefulWidget {
  final int complaintId;

  // We receive the ID from the navigation arguments
  const ComplaintDetailScreen({super.key, required this.complaintId});

  @override
  _ComplaintDetailScreenState createState() => _ComplaintDetailScreenState();
}

class _ComplaintDetailScreenState extends State<ComplaintDetailScreen> {
  final StatusService _statusService = StatusService();
  final FeedbackService _feedbackService = FeedbackService();
  late Future<ComplaintDetails> _detailsFuture;

  // --- NEW: Function to show feedback dialog ---
void _showFeedbackDialog(ComplaintDetails details) {
  final commentController = TextEditingController();
  int rating = 0; // Will hold the star rating

  showDialog(
    context: context,
    builder: (context) {
      // Using StatefulBuilder to update the stars inside the dialog
      return StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text("Leave Feedback"),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text("Please rate the resolution:"),
                  // Simple star rating
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      return IconButton(
                        icon: Icon(
                          index < rating ? Icons.star : Icons.star_border,
                          color: Colors.amber,
                        ),
                        onPressed: () {
                          setDialogState(() {
                            rating = index + 1;
                          });
                        },
                      );
                    }),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: commentController,
                    decoration: const InputDecoration(
                      labelText: "Comment (Optional)",
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text("Cancel"),
              ),
              ElevatedButton(
                onPressed: (rating == 0) ? null : () { // Disable button if no rating
                  _submitFeedback(
                    details.complaintId,
                    rating,
                    commentController.text,
                  );
                },
                child: const Text("Submit"),
              ),
            ],
          );
        },
      );
    },
  );
}

// --- NEW: Function to handle the actual submission ---
void _submitFeedback(int complaintId, int rating, String comment) async {
  Navigator.of(context).pop(); // Close dialog

  final error = await _feedbackService.submitFeedback(
    complaintId: complaintId,
    rating: rating,
    comment: comment.isEmpty ? null : comment,
  );

  if (error == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Feedback submitted! Thank you!"),
        backgroundColor: Colors.green,
      ),
    );
    // Refresh the page to hide the button
    setState(() {
      _detailsFuture = _statusService.getComplaintHistory(widget.complaintId);
    });
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Error: $error"),
        backgroundColor: Colors.red,
      ),
    );
  }
}

  @override
  void initState() {
    super.initState();
    // Use the ID from the widget to fetch the data
    _detailsFuture = _statusService.getComplaintHistory(widget.complaintId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Complaint Details"),
      ),
      body: FutureBuilder<ComplaintDetails>(
        future: _detailsFuture,
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
            final details = snapshot.data!;
            return _buildDetails(details);
          }

          // Default case
          return const Center(child: Text("No data found."));
        },
      ),
    );
  }

  // Helper to build the main view
  Widget _buildDetails(ComplaintDetails details) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              details.title,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              "Status: ${details.currentStatus}",
              style: const TextStyle(fontSize: 18, fontStyle: FontStyle.italic),
            ),
            Text("Filed on: ${details.createdAt.toLocal().toString().split(' ')[0]}"),
            Text("Total Time: ${details.totalResolutionTime}"),
            const Divider(height: 32, thickness: 1),

            if ((details.currentStatus == "Resolved" || details.currentStatus == "Closed") &&
            !details.hasFeedback)
          Center(
            child: ElevatedButton.icon(
              icon: const Icon(Icons.star),
              label: const Text("Leave Feedback"),
              onPressed: () => _showFeedbackDialog(details),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber[700],
              ),
            ),
          ),
            const SizedBox(height: 16),
            const Text(
              "Status History",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            if (details.timeline.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: Text("No status history found yet. Check back later."),
                ),
                )
            else
            // This widget is perfect for showing a timeline
            Stepper(
              // physics: ClampingScrollPhysics(), // Use this if you have scrolling issues
              currentStep: details.timeline.length - 1,
              controlsBuilder: (context, details) => Container(), // Hides buttons
              steps: details.timeline.map((update) {
                return Step(
                  title: Text(
                    update.status,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  subtitle: Text(update.updatedAt.toLocal().toString()),
                  content: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (update.remarks != null) Text(update.remarks!),
                      Text("Updated by: ${update.updatedBy ?? 'System'}"),
                      Text("Time in previous status: ${update.timeSpentFormatted}"),
                    ],
                  ),
                  isActive: true,
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}