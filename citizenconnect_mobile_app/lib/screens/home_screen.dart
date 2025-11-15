import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  // Logout function
  void _logout(BuildContext context) async {
    // Disconnect from sockets and clear token
    SocketService().disconnect();
    await AuthService().logout();

    // Go back to login screen and remove all other screens
    Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Citizen Dashboard"),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          // Notification Bell Button
          IconButton(
            icon: const Icon(Icons.notifications),
            tooltip: 'Notifications',
            onPressed: () {
              Navigator.of(context).pushNamed('/notifications');
            },
          ),
          // Logout Button
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () => _logout(context),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Welcome Card
            Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  "Welcome! How can we help you today?",
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // "Raise Complaint" Button
            _DashboardButton(
              icon: Icons.add_comment,
              title: "Raise a New Complaint",
              subtitle: "Report a new issue in your area.",
              color: Colors.blue,
              onTap: () {
                Navigator.of(context).pushNamed('/raise-complaint');
              },
            ),

            const SizedBox(height: 16),

            _DashboardButton(
              icon: Icons.map,
              title: "View Public Map",
              subtitle: "See all active complaints in your city.",
              color: Colors.purple,
              onTap: () {
                Navigator.of(context).pushNamed('/public-heatmap');
              },
            ),

            // "View My Complaints" Button
            _DashboardButton(
              icon: Icons.list_alt,
              title: "View My Complaints",
              subtitle: "Check the status of your existing complaints.",
              color: Colors.green,
              onTap: () {
                Navigator.of(context).pushNamed('/my-complaints');
              },
            ),
          ],
        ),
      ),
    );
  }
}

// --- This is a new helper widget to make the buttons look nice ---
class _DashboardButton extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _DashboardButton({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Icon(icon, size: 40, color: color),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios),
            ],
          ),
        ),
      ),
    );
  }
}