package com.example.project.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.example.project.entity.User;
import com.example.project.repository.UserRepository;
import com.example.project.service.KycService;

import java.util.Map;

@RestController
@RequestMapping("/api/kyc")
public class KycController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private KycService kycService;

    // POST /api/kyc/submit — agent or owner submits KYC details
    @PostMapping("/submit")
    public ResponseEntity<String> submit(Authentication auth, @RequestBody Map<String, String> body) {
        String email = auth.getName();
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setKycDocumentType(body.get("documentType"));
        user.setKycDocumentNumber(body.get("documentNumber"));
        user.setKycStatus("SUBMITTED");
        userRepo.save(user);
        return ResponseEntity.ok("KYC submitted. You will be marked as verified shortly.");
    }

    // GET /api/kyc/status — check own KYC status
    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> status(Authentication auth) {
        User user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(Map.of(
            "kycStatus", user.getKycStatus() != null ? user.getKycStatus() : "NONE",
            "documentType", user.getKycDocumentType() != null ? user.getKycDocumentType() : ""
        ));
    }

    @PutMapping("/admin-verify/{userId}")
    public ResponseEntity<String> adminVerify(@PathVariable Long userId) {
        String result = kycService.adminVerify(userId);
        return ResponseEntity.ok(result);
    }
}
