// lib/models/notification_model.dart

class NotificationModel {
  final int id;
  final String message;
  final bool isRead;
  final DateTime createdAt;
  final int? complaintId;

  NotificationModel({
    required this.id,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.complaintId,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'],
      message: json['message'],
      isRead: json['isRead'],
      createdAt: DateTime.parse(json['createdAt']),
      complaintId: json['complaintId'],
    );
  }
}