// lib/models/complaint_model.dart

class Complaint {
  final int id;
  final String title;
  final String description;
  final String domain;
  final String category;
  final String status;
  final String? mediaUrl;
  final DateTime createdAt;

  Complaint({
    required this.id,
    required this.title,
    required this.description,
    required this.domain,
    required this.category,
    required this.status,
    required this.createdAt,
    this.mediaUrl,
  });

  // Factory constructor to create a Complaint from JSON
  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      domain: json['domain'],
      category: json['category'],
      status: json['status'],
      createdAt: DateTime.parse(json['createdAt']),
      mediaUrl: json['mediaUrl'],
    );
  }
}