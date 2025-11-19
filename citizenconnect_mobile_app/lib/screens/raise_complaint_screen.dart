import 'dart:io'; // --- NEW ---
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart'; // --- NEW ---
import 'package:geocoding/geocoding.dart'; // 
import 'package:image_picker/image_picker.dart'; // --- NEW ---
import '../services/domain_service.dart';
import '../services/complaint_service.dart'; // --- NEW ---

enum ImageSourceChoice { camera, gallery }

class RaiseComplaintScreen extends StatefulWidget {
  const RaiseComplaintScreen({super.key});

  @override
  _RaiseComplaintScreenState createState() => _RaiseComplaintScreenState();
}

class _RaiseComplaintScreenState extends State<RaiseComplaintScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  final DomainService _domainService = DomainService();
  final ComplaintService _complaintService = ComplaintService(); // --- NEW ---

  Map<String, dynamic> _domainData = {};
  List<String> _domains = [];
  List<String> _categories = [];

  String? _selectedDomain;
  String? _selectedCategory;

  bool _isLoading = true;
  bool _isSubmitting = false; // --- NEW ---
  String? _errorMessage;

  // --- NEW: Variables for native features ---
  File? _imageFile;
  Position? _position;
  String _locationMessage = "No location selected.";
  // -----------------------------------------

  @override
  void initState() {
    super.initState();
    _fetchDomains();
  }

  void _fetchDomains() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final data = await _domainService.getDomains();
      setState(() {
        _domainData = data;
        _domains = data.keys.toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  void _onDomainChanged(String? newValue) {
    if (newValue == null) return;
    List<dynamic> categoryList = _domainData[newValue] ?? [];
    setState(() {
      _selectedDomain = newValue;
      _selectedCategory = null;
      _categories = categoryList.map((item) => item['category'].toString()).toList();
    });
  }

// --- NEW, CORRECTED _pickImage Function ---
Future<void> _pickImage() async {
  final picker = ImagePicker();
  XFile? pickedFile;

  // 1. Ask the user to choose a source
  final ImageSourceChoice? choice = await showDialog<ImageSourceChoice>(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        title: const Text('Select Photo Source'),
        content: SingleChildScrollView(
          child: ListBody(
            children: <Widget>[
              GestureDetector(
                child: const Text('Camera'),
                onTap: () {
                  // 3. Return the choice (don't pick image yet)
                  Navigator.of(context).pop(ImageSourceChoice.camera);
                },
              ),
              const Padding(padding: EdgeInsets.all(8.0)),
              GestureDetector(
                child: const Text('Gallery (Browse Files)'),
                onTap: () {
                  // 4. Return the choice (don't pick image yet)
                  Navigator.of(context).pop(ImageSourceChoice.gallery);
                },
              ),
            ],
          ),
        ),
      );
    },
  );

  // 5. The dialog is now closed. If the user made a choice, 'choice' is not null.
  if (choice == null) return; // User tapped outside the dialog

  // 6. NOW, we pick the image based on their choice.
  if (choice == ImageSourceChoice.camera) {
    pickedFile = await picker.pickImage(source: ImageSource.camera);
  } else {
    pickedFile = await picker.pickImage(source: ImageSource.gallery);
  }

  // 7. After the image is picked, update the state
  if (pickedFile != null) {
    setState(() {
      _imageFile = File(pickedFile!.path);
    });
  }
}

  // --- UPDATED: Get Location & Address ---
  Future<void> _getLocation() async {
    try {
      // 1. Check permissions (Same as before)
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _locationMessage = "Location permissions are denied.";
          });
          return;
        }
      }

      setState(() {
        _locationMessage = "Fetching location...";
      });

      // 2. Get GPS Coordinates
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      // 3. Convert GPS to Address (Reverse Geocoding)
      try {
        List<Placemark> placemarks = await placemarkFromCoordinates(
          position.latitude,
          position.longitude,
        );

        if (placemarks.isNotEmpty) {
          Placemark place = placemarks[0];
          // Construct a readable address string
          String address = "${place.street}, ${place.subLocality}, ${place.locality}, ${place.postalCode}";
          
          setState(() {
            _position = position;
            // Store the address string to send to backend
            _locationMessage = address; 
          });
        } else {
           setState(() {
            _position = position;
            _locationMessage = "Lat: ${position.latitude}, Long: ${position.longitude}";
          });
        }
      } catch (e) {
        // Fallback if geocoding fails (e.g., no internet)
        setState(() {
          _position = position;
          _locationMessage = "Lat: ${position.latitude}, Long: ${position.longitude}";
        });
      }

    } catch (e) {
      setState(() {
        _locationMessage = "Failed to get location: $e";
      });
    }
  }

  // --- UPDATED: Submit function ---
  void _submitComplaint() async {
    // --- NEW VALIDATION BLOCK ---
  if (_imageFile == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('A photo is required to submit.'),
        backgroundColor: Colors.red,
      ),
    );
    return; // Stop submission
  }

  if (_position == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Location is required. Please tap "Get Location".'),
        backgroundColor: Colors.red,
      ),
    );
    return; // Stop submission
  }
  // --- END NEW VALIDATION BLOCK ---

  // This code only runs if the checks above pass
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isSubmitting = true;
      });

      final error = await _complaintService.raiseComplaint(
        title: _titleController.text,
        description: _descriptionController.text,
        domain: _selectedDomain!,
        category: _selectedCategory!,
        latitude: _position!.latitude,
        longitude: _position!.longitude,
        imageFile: _imageFile,
      );

      setState(() {
        _isSubmitting = false;
      });

      if (error == null) {
        // Success!
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Complaint raised successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        // Show error
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Raise a New Complaint"),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text("Error: $_errorMessage", style: const TextStyle(color: Colors.red)),
            ElevatedButton(
              onPressed: _fetchDomains,
              child: const Text("Retry"),
            )
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Complaint Title',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                initialValue: _selectedDomain,
                decoration: const InputDecoration(
                  labelText: 'Domain',
                  border: OutlineInputBorder(),
                ),
                hint: const Text('Select a domain'),
                items: _domains.map((domain) {
                  return DropdownMenuItem(value: domain, child: Text(domain));
                }).toList(),
                onChanged: _onDomainChanged,
                validator: (value) =>
                    value == null ? 'Domain is required' : null,
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                initialValue: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Category',
                  border: OutlineInputBorder(),
                ),
                hint: Text(
                    _selectedDomain == null ? 'Select a domain first' : 'Select a category'),
                items: _selectedDomain == null ? [] : _categories.map((category) {
                  return DropdownMenuItem(value: category, child: Text(category));
                }).toList(),
                onChanged: (newValue) {
                  setState(() {
                    _selectedCategory = newValue;
                  });
                },
                validator: (value) =>
                    value == null ? 'Category is required' : null,
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
                maxLines: 5,
                validator: (value) =>
                    value == null || value.isEmpty ? 'Description is required' : null,
              ),
              const SizedBox(height: 20),

              // --- NEW: Native Feature Buttons ---
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ElevatedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.camera_alt),
                    label: const Text("Add Photo"),
                  ),
                  ElevatedButton.icon(
                    onPressed: _getLocation,
                    icon: const Icon(Icons.location_on),
                    label: const Text("Get Location"),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // --- NEW: Preview areas ---
              if (_imageFile != null)
                Column(
                  children: [
                    const Text("Photo selected:"),
                    Image.file(_imageFile!, height: 100),
                    const SizedBox(height: 10),
                  ],
                ),

              Text(_locationMessage, style: const TextStyle(color: Colors.grey)),
              // -----------------------------

              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isSubmitting ? null : _submitComplaint,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isSubmitting 
                    ? const CircularProgressIndicator(color: Colors.white) 
                    : const Text('Submit Complaint'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}