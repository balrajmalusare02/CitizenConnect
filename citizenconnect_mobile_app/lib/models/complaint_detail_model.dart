// lib/models/complaint_detail_model.dart

// Represents one step in the timeline
class StatusUpdate {
  final int id;
  final String status;
  final String? remarks;
  final String? updatedBy; // Simplified to just the name for now
  final DateTime updatedAt;
  final String timeSpentFormatted;

  StatusUpdate({
    required this.id,
    required this.status,
    required this.remarks,
    required this.updatedBy,
    required this.updatedAt,
    required this.timeSpentFormatted,
  });

  factory StatusUpdate.fromJson(Map<String, dynamic> json) {
    return StatusUpdate(
      id: json['id'],
      status: json['status'],
      remarks: json['remarks'],
      updatedBy: json['updatedBy'] != null ? json['updatedBy']['name'] : 'System',
      updatedAt: DateTime.parse(json['updatedAt']),
      timeSpentFormatted: json['timeSpentFormatted'] ?? 'Current',
    );
  }
}

// Represents the entire page's data
class ComplaintDetails {
  final int complaintId;
  final String title;
  final String currentStatus;
  final DateTime createdAt;
  final String totalResolutionTime;
  final List<StatusUpdate> timeline;
  final bool hasFeedback;

  ComplaintDetails({
    required this.complaintId,
    required this.title,
    required this.currentStatus,
    required this.createdAt,
    required this.totalResolutionTime,
    required this.timeline,
    required this.hasFeedback,
  });

  factory ComplaintDetails.fromJson(Map<String, dynamic> json) {
    var timelineList = json['timeline'] as List;
    List<StatusUpdate> timeline = timelineList.map((i) => StatusUpdate.fromJson(i)).toList();

    return ComplaintDetails(
      complaintId: json['complaintId'],
      title: json['title'],
      currentStatus: json['currentStatus'],
      createdAt: DateTime.parse(json['createdAt']),
      totalResolutionTime: json['totalResolutionTime'],
      timeline: timeline,
      hasFeedback: json['hasFeedback'] ?? false,
    );
  }
}