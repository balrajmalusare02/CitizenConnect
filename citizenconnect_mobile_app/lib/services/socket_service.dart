// lib/services/socket_service.dart

import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'auth_service.dart'; // Needed to get the JWT token

class SocketService {
  // Singleton pattern (so we use the same connection everywhere)
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;

  IO.Socket? _socket;
  final AuthService _authService = AuthService();

  // ⚠️ USE 10.0.2.2 for Android Emulator
  final String _socketUrl = "http://10.0.2.2:4000"; 

  SocketService._internal();

  // Connect to the backend
  Future<void> connect() async {
    // If already connected, do nothing
    if (_socket != null && _socket!.connected) return;

    final token = await _authService.getToken();
    if (token == null) {
      print("Socket: No token found, cannot connect.");
      return;
    }

    print("Socket: Attempting to connect to $_socketUrl...");

    _socket = IO.io(_socketUrl, <String, dynamic>{
      'transports': ['websocket'], // Force WebSocket for speed
      'autoConnect': true,
      'auth': { 'token': token } // Send JWT for authentication
    });

    _socket!.onConnect((_) {
      print('✅ Socket: Connected successfully!');
    });

    _socket!.onDisconnect((_) {
      print('❌ Socket: Disconnected');
    });

    _socket!.onConnectError((data) {
      print('⚠️ Socket Error: $data');
    });
  }

  // Disconnect (e.g., on logout)
  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  // --- Listeners ---

  // Listen for "complaint-status-updated" (matches backend event)
  void onComplaintStatusUpdated(Function(dynamic data) callback) {
    _socket?.on('complaint-status-updated', callback);
  }

  // Listen for "new-notification" (matches backend event)
  void onNewNotification(Function(dynamic data) callback) {
    _socket?.on('new-notification', callback);
  }

  // Stop listening (clean up)
  void removeAllListeners() {
    _socket?.off('complaint-status-updated');
    _socket?.off('new-notification');
  }
}