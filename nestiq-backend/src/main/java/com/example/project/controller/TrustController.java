package com.example.project.controller;

import com.example.project.service.TrustService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/trust")
public class TrustController {

    private final TrustService trustService;

    public TrustController(TrustService trustService) {
        this.trustService = trustService;
    }

    /**
     * Full trust breakdown: { documentVerification, agentActivity,
     * customerReviews, listingQuality, fraudSignals, totalScore, status, color }
     */
    @GetMapping("/breakdown/{propertyId}")
    public ResponseEntity<?> getBreakdown(@PathVariable Long propertyId) {
        try {
            return ResponseEntity.ok(trustService.getBreakdown(propertyId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** Just the numeric totalScore — lightweight call for property cards. */
    @GetMapping("/score/{propertyId}")
    public ResponseEntity<?> getScore(@PathVariable Long propertyId) {
        try {
            return ResponseEntity.ok(trustService.getScore(propertyId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
