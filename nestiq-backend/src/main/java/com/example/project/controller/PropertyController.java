package com.example.project.controller;

import com.example.project.dto.PropertyDTO;
import com.example.project.service.PropertyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    // ── PUBLIC ─────────────────────────────────────────────────────────────
    @GetMapping("/public")
    public ResponseEntity<List<PropertyDTO>> getPublic(
            @RequestParam(required = false) List<String> cities,
            @RequestParam(required = false) String listingType,
            @RequestParam(required = false) List<Integer> bhks,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String propertyType,
            @RequestParam(required = false) String sortBy) {
        return ResponseEntity.ok(propertyService.getPublicProperties(cities, listingType, bhks, minPrice, maxPrice, propertyType, sortBy));
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<?> getPublicById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(propertyService.getPublicProperty(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── AGENT ──────────────────────────────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<PropertyDTO>> getMyProperties(Authentication auth) {
        return ResponseEntity.ok(propertyService.getMyProperties(auth.getName()));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PropertyDTO req, Authentication auth) {
        try {
            return ResponseEntity.ok(propertyService.create(auth.getName(), req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody PropertyDTO req,
                                    Authentication auth) {
        try {
            return ResponseEntity.ok(propertyService.update(auth.getName(), id, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        try {
            propertyService.delete(auth.getName(), id);
            return ResponseEntity.ok("Deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Open owner requests — agents browse and accept
    @GetMapping("/open-requests")
    public ResponseEntity<List<PropertyDTO>> getOpenRequests() {
        return ResponseEntity.ok(propertyService.getOpenRequests());
    }

    // Agent accepts assignment of an owner-listed property
    @PutMapping("/{id}/accept-assignment")
    public ResponseEntity<PropertyDTO> acceptAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(propertyService.acceptAssignment(id));
    }

    // Update property status (e.g. SOLD or RENTED)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @RequestBody java.util.Map<String, String> body,
                                           Authentication auth) {
        try {
            String status = body.get("status");
            return ResponseEntity.ok(propertyService.updateStatus(auth.getName(), id, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}