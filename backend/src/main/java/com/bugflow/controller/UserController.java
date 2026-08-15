package com.bugflow.controller;

import com.bugflow.dto.UserResponse;
import com.bugflow.dto.UserUpdateRequest;
import com.bugflow.dto.MessageResponse;
import com.bugflow.model.User;
import com.bugflow.model.UserRole;
import com.bugflow.repository.UserRepository;
import com.bugflow.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        // Check if username already taken by another user
        userRepository.findByUsername(request.getUsername()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Error: Username is already taken!");
            }
        });

        // Check if email already taken by another user
        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Error: Email is already in use!");
            }
        });

        // Parse user role
        UserRole userRole;
        try {
            userRole = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Invalid role specified. Allowed values: ADMIN, PROJECT_MANAGER, DEVELOPER, TESTER"));
        }

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(userRole);

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(UserResponse.fromUser(savedUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        // Prevent self deletion
        if (userToDelete.getUsername().equals(userDetails.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: You cannot delete your own account!"));
        }

        userRepository.delete(userToDelete);
        return ResponseEntity.ok(new MessageResponse("User deleted successfully!"));
    }

    @PutMapping("/profile/availability")
    public ResponseEntity<UserResponse> updateAvailability(@RequestParam boolean available,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getUsername()));
        user.setAvailable(available);
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(UserResponse.fromUser(savedUser));
    }
}
