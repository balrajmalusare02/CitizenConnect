import 'package:flutter/material.dart';
import 'package:citizenconnect_mobile_app/services/auth_service.dart'; // Update the path as needed

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  
  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  String? _errorMessage;


  bool _isLoading = false;
  final AuthService _authService = AuthService();

  void _register() async {
  // --- NEW: Password Match Validation ---
  if (_passwordController.text != _confirmPasswordController.text) {
    setState(() {
      _errorMessage = "Passwords do not match.";
    });
    return; // Stop submission
  }
  // --- END NEW ---

  setState(() {
    _isLoading = true;
    _errorMessage = null; // Clear old errors
  });

  final error = await _authService.register(
    _nameController.text,
    _emailController.text,
    _passwordController.text,
  );

    setState(() { _isLoading = false; });

    if (error == null) {
      // Register successful! Navigate to HomeScreen
      Navigator.of(context).pushReplacementNamed('/home');
    } else {
      // Show error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red),
      );
    }
  }

  @override
Widget build(BuildContext context) {
  return Scaffold(
    appBar: AppBar(title: const Text("Create Account")), // Keep app bar for "back"
    body: SafeArea(
      child: SingleChildScrollView( // Added for scrolling
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // --- NEW: Polished UI ---
              Icon(
                Icons.person_add,
                size: 80,
                color: Colors.blue.shade700,
              ),
              const SizedBox(height: 16),
              Text(
                "Create New Account",
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 40),
              // --- END NEW ---

              TextField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: "Name",
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
              ),
              const SizedBox(height: 16),
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

              // --- UPDATED: Password Field ---
              TextField(
                controller: _passwordController,
                obscureText: !_isPasswordVisible,
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
                      setState(() {
                        _isPasswordVisible = !_isPasswordVisible;
                      });
                    },
                  ),
                ),
              ),
              // --- END UPDATE ---

              const SizedBox(height: 16),

              // --- NEW: Confirm Password Field ---
              TextField(
                controller: _confirmPasswordController,
                obscureText: !_isConfirmPasswordVisible,
                decoration: InputDecoration(
                  labelText: "Confirm Password",
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _isConfirmPasswordVisible
                          ? Icons.visibility
                          : Icons.visibility_off,
                    ),
                    onPressed: () {
                      setState(() {
                        _isConfirmPasswordVisible =
                            !_isConfirmPasswordVisible;
                      });
                    },
                  ),
                ),
              ),
              // --- END NEW ---

              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.blue.shade700,
                  foregroundColor: Colors.white,
                ),
                onPressed: _isLoading ? null : _register,
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text("Register", style: TextStyle(fontSize: 16)),
              ),
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop(); // Go back
                },
                child: const Text("Already have an account? Login"),
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
    ),
  );
}
}