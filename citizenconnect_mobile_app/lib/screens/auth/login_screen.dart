import 'package:flutter/material.dart';
// Import your AuthService and state management (e.g., Provider)
import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  bool _isPasswordVisible = false;

  // You would inject this via Provider, but we'll create it here for simplicity
  final AuthService _authService = AuthService();

  void _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final error = await _authService.login(
      _emailController.text,
      _passwordController.text,
    );

    print("AuthService returned: $error");

    setState(() {
      _isLoading = false;
    });

    if (error == null) {
      // Login successful! Navigate to HomeScreen
    Navigator.of(context).pushReplacementNamed('/home');
    } else {
      // Show error
      setState(() {
        _errorMessage = error;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red),
      );
    }
  }

  @override
Widget build(BuildContext context) {
  return Scaffold(
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // --- App Logo/Icon ---
            Icon(
              Icons.how_to_vote,
              size: 80,
              color: Colors.blue.shade700,
            ),
            const SizedBox(height: 16),
            Text(
              "CitizenConnect",
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineLarge,
            ),
            Text(
              "Log in to your account",
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 40),

            TextField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: "Email",
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.email),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),

            // --- UPDATED PASSWORD FIELD ---
            TextField(
              controller: _passwordController,
              obscureText: !_isPasswordVisible, // Controlled by our variable
              decoration: InputDecoration(
                labelText: "Password",
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.lock),
                suffixIcon: IconButton(
                  icon: Icon(
                    _isPasswordVisible
                        ? Icons.visibility
                        : Icons.visibility_off,
                  ),
                  onPressed: () {
                    // Toggle the visibility
                    setState(() {
                      _isPasswordVisible = !_isPasswordVisible;
                    });
                  },
                ),
              ),
            ),
            // --- END UPDATE ---

            const SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: Colors.blue.shade700,
                foregroundColor: Colors.white,
              ),
              onPressed: _isLoading ? null : _login,
              child: _isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text("Login", style: TextStyle(fontSize: 16)),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pushNamed('/register');
              },
              child: const Text("Don't have an account? Register"),
            ),
            if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(12),
                color: Colors.red.shade100,
                child: Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                ),
              )
          ],
        ),
      ),
    ),
  );
}
}