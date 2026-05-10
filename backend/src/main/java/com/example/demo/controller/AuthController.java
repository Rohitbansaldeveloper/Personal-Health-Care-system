package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allow frontend to call these endpoints
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // Basic plain text password check for prototyping (In production, use BCrypt!)
            if (user.getPassword().equals(loginRequest.getPassword())) {
                if (loginRequest.getRole() != null && !loginRequest.getRole().equalsIgnoreCase(user.getRole())) {
                    return ResponseEntity.status(403).body("Access denied. You are registered as a " + user.getRole() + ".");
                }
                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.status(401).body("Invalid email or password");
    }
}
