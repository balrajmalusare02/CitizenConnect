// lib/screens/notifications_screen.dart

import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  _NotificationsScreenState createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationService _notificationService = NotificationService();
  late Future<List<NotificationModel>> _notificationsFuture;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  void _fetchNotifications() {
    _notificationsFuture = _notificationService.getMyNotifications();
  }

  // Function to handle tapping on a notification
  void _onNotificationTapped(NotificationModel notification) {
    // Mark it as read
    if (!notification.isRead) {
      _notificationService.markAsRead(notification.id).then((_) {
        // Refresh the list after marking as read
        setState(() {
          _fetchNotifications();
        });
      });
    }

    // If it's linked to a complaint, go to the detail page
    if (notification.complaintId != null) {
      Navigator.of(context).pushNamed(
        '/complaint-detail',
        arguments: notification.complaintId,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Notifications"),
      ),
      body: FutureBuilder<List<NotificationModel>>(
        future: _notificationsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

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

          if (snapshot.hasData) {
            final notifications = snapshot.data!;
            if (notifications.isEmpty) {
              return const Center(
                child: Text(
                  "You have no notifications.",
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              );
            }

            // Show the list
            return ListView.builder(
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return Card(
                  color: notification.isRead ? Colors.white : Colors.blue[50],
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ListTile(
                    leading: Icon(
                      notification.isRead
                          ? Icons.notifications_none
                          : Icons.notifications_active,
                      color: notification.isRead ? Colors.grey : Colors.blue,
                    ),
                    title: Text(notification.message),
                    subtitle: Text(
                      notification.createdAt.toLocal().toString().split('.')[0],
                    ),
                    onTap: () => _onNotificationTapped(notification),
                  ),
                );
              },
            );
          }

          return const Center(child: Text("No data found."));
        },
      ),
    );
  }
}