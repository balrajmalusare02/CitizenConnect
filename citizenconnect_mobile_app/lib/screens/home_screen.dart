import 'package:flutter/material.dart';
import '../services/auth_service.dart'; // <-- Import AuthService

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  void _logout(BuildContext context) async {
    // Create an instance of AuthService to use
    await AuthService().logout();
    // Go back to login screen and remove all other screens
    Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("CitizenConnect Home"),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [

        IconButton(
          icon: const Icon(Icons.notifications),
          tooltip: 'Notifications',
          onPressed: () {
            Navigator.of(context).pushNamed('/notifications');
          },
        ),  
        IconButton(
          icon: const Icon(Icons.list_alt),
          tooltip: 'My Complaints',
          onPressed: () {
            Navigator.of(context).pushNamed('/my-complaints');
          },  
        ),
          // --- ADD THIS LOGOUT BUTTON ---
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () => _logout(context),
          ),
          // -----------------------------
        ],
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 80),
            SizedBox(height: 16),
            Text(
              "Login Successful!",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            Text("Welcome to your dashboard.", style: TextStyle(fontSize: 16)),
          ],
        ),
      ),
      // --- ADD THIS FLOATING ACTION BUTTON ---
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // We will create this route in the next steps
          Navigator.of(context).pushNamed('/raise-complaint');
        },
        tooltip: 'Raise Complaint',
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
      // ------------------------------------
    );
  }
}
