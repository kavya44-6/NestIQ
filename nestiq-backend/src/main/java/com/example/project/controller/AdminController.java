package com.example.project.controller;

import com.example.project.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            return ResponseEntity.ok(adminService.getStats());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        try {
            return ResponseEntity.ok(adminService.getAllUsers());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/properties")
    public ResponseEntity<?> getProperties() {
        try {
            return ResponseEntity.ok(adminService.getAllProperties());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/kyc/{userId}/verify")
    public ResponseEntity<?> verifyKyc(@PathVariable Long userId) {
        try {
            adminService.verifyKyc(userId);
            return ResponseEntity.ok("KYC verified successfully for user: " + userId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/kyc/{userId}/reject")
    public ResponseEntity<?> rejectKyc(@PathVariable Long userId) {
        try {
            adminService.rejectKyc(userId);
            return ResponseEntity.ok("KYC rejected for user: " + userId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/property/{id}/approve")
    public ResponseEntity<?> approveProperty(@PathVariable Long id) {
        try {
            adminService.approveProperty(id);
            return ResponseEntity.ok("Property approved successfully: " + id);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/property/{id}/reject")
    public ResponseEntity<?> rejectProperty(@PathVariable Long id) {
        try {
            adminService.rejectProperty(id);
            return ResponseEntity.ok("Property rejected: " + id);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/property/{id}")
    public ResponseEntity<?> deleteProperty(@PathVariable Long id) {
        try {
            adminService.deleteProperty(id);
            return ResponseEntity.ok("Property deleted successfully: " + id);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/property/{id}/recalculate-trust")
    public ResponseEntity<?> recalculateTrust(@PathVariable Long id) {
        try {
            adminService.recalculateTrust(id);
            return ResponseEntity.ok("Trust score recalculated: " + id);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
