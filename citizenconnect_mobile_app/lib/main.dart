import 'package:flutter/material.dart';
import 'screens/auth/login_screen.dart'; // Import login screen
import 'screens/auth/register_screen.dart'; // Import register screen
import 'screens/home_screen.dart'; 
import 'screens/raise_complaint_screen.dart'; // <-- ADD THIS IMPORT// <-- ADD THIS IMPORT
import 'screens/my_complaints_screen.dart';
import 'screens/complaint_detail_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/public_heatmap_screen.dart';
import 'screens/profile_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CitizenConnect',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      // Start the app at the LoginScreen
      home: const LoginScreen(), 

      // --- REPLACE 'routes:' WITH 'onGenerateRoute:' ---
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/login':
            return MaterialPageRoute(builder: (_) => const LoginScreen());
          case '/register':
            return MaterialPageRoute(builder: (_) => const RegisterScreen());
          case '/home':
            return MaterialPageRoute(builder: (_) => const HomeScreen());
          case '/raise-complaint':
            return MaterialPageRoute(builder: (_) => const RaiseComplaintScreen());
          case '/my-complaints':
            return MaterialPageRoute(builder: (_) => const MyComplaintsScreen());
          case '/notifications':
            return MaterialPageRoute(builder: (_) => const NotificationsScreen());
          case '/public-heatmap':
            return MaterialPageRoute(builder: (_) => const PublicHeatmapScreen());
          case '/profile': // <-- ADD THIS CASE
            return MaterialPageRoute(builder: (_) => const ProfileScreen());

          // This is how we handle routes that need arguments
          case '/complaint-detail':
            final int complaintId = settings.arguments as int;
            return MaterialPageRoute(
              builder: (_) => ComplaintDetailScreen(complaintId: complaintId),
            );

          default:
            return MaterialPageRoute(builder: (_) => const LoginScreen());
        }
      },
    );
  }
}