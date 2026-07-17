package com.example.project.controller;

import com.example.project.dto.InquiryDTO;
import com.example.project.dto.OwnerMessageDTO;
import com.example.project.dto.PropertyDTO;
import com.example.project.dto.VisitDTO;
import com.example.project.service.OwnerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    private final OwnerService ownerService;

    public OwnerController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication auth) {
        return ResponseEntity.ok(ownerService.getDashboardStats(auth.getName()));
    }

    @GetMapping("/properties")
    public ResponseEntity<List<PropertyDTO>> getProperties(Authentication auth) {
        return ResponseEntity.ok(ownerService.getMyProperties(auth.getName()));
    }

    @PostMapping("/properties")
    public ResponseEntity<?> createProperty(@RequestBody PropertyDTO req, Authentication auth) {
        try {
            return ResponseEntity.ok(ownerService.addProperty(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/inquiries")
    public ResponseEntity<List<InquiryDTO>> getInquiries(Authentication auth) {
        return ResponseEntity.ok(ownerService.getMyInquiries(auth.getName()));
    }

    @GetMapping("/visits")
    public ResponseEntity<List<VisitDTO>> getVisits(Authentication auth) {
        return ResponseEntity.ok(ownerService.getMyVisits(auth.getName()));
    }

    @GetMapping("/messages")
    public ResponseEntity<List<OwnerMessageDTO>> getMessages(Authentication auth) {
        return ResponseEntity.ok(ownerService.getMessages(auth.getName()));
    }

    @PutMapping("/messages/{id}/reply")
    public ResponseEntity<?> replyToMessage(@PathVariable Long id,
                                             @RequestBody Map<String, String> body,
                                             Authentication auth) {
        try {
            String reply = body.get("reply");
            return ResponseEntity.ok(ownerService.replyToMessage(auth.getName(), id, reply));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
