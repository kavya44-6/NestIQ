package com.example.project.service;

import com.example.project.entity.Property;
import com.example.project.entity.User;
import com.example.project.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepo;
    private final PropertyRepository propertyRepo;
    private final InquiryRepository inquiryRepo;
    private final VisitRepository visitRepo;
    private final KycService kycService;
    private final TrustService trustService;
    private final AiService aiService;

    public AdminService(UserRepository userRepo,
                        PropertyRepository propertyRepo,
                        InquiryRepository inquiryRepo,
                        VisitRepository visitRepo,
                        @org.springframework.context.annotation.Lazy KycService kycService,
                        @org.springframework.context.annotation.Lazy TrustService trustService,
                        @org.springframework.context.annotation.Lazy AiService aiService) {
        this.userRepo = userRepo;
        this.propertyRepo = propertyRepo;
        this.inquiryRepo = inquiryRepo;
        this.visitRepo = visitRepo;
        this.kycService = kycService;
        this.trustService = trustService;
        this.aiService = aiService;
    }

    public Map<String, Object> getStats() {
        long totalUsers = userRepo.count();
        long totalProperties = propertyRepo.count();
        long totalInquiries = inquiryRepo.count();
        long totalVisits = visitRepo.count();

        long pendingKyc = userRepo.findAll().stream()
                .filter(u -> "SUBMITTED".equals(u.getKycStatus()))
                .count();

        long lowTrustProperties = propertyRepo.findAll().stream()
                .filter(p -> p.getTrustScore() != null && p.getTrustScore() < 40)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalProperties", totalProperties);
        stats.put("totalInquiries", totalInquiries);
        stats.put("totalVisits", totalVisits);
        stats.put("pendingKyc", pendingKyc);
        stats.put("lowTrustProperties", lowTrustProperties);
        return stats;
    }

    public List<Map<String, Object>> getAllUsers() {
        return userRepo.findAll().stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", u.getRole().name());
            map.put("kycStatus", u.getKycStatus());
            map.put("verified", u.isVerified());
            map.put("createdAt", u.getCreatedAt());
            map.put("kycDocumentType", u.getKycDocumentType());
            map.put("kycDocumentNumber", u.getKycDocumentNumber());
            return map;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAllProperties() {
        return propertyRepo.findAll().stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("title", p.getTitle());
            map.put("city", p.getCity());
            map.put("bhk", p.getBhk());
            map.put("price", p.getPrice());
            map.put("status", p.getStatus());
            map.put("trustScore", p.getTrustScore());
            map.put("agentRequestStatus", p.getAgentRequestStatus());
            map.put("approved", p.getApproved());
            map.put("ownerName", p.getOwner() != null ? p.getOwner().getName() : null);
            map.put("agentName", p.getAgent() != null ? p.getAgent().getName() : null);
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void verifyKyc(Long userId) {
        kycService.adminVerify(userId);
    }

    @Transactional
    public void rejectKyc(Long userId) {
        kycService.adminReject(userId);
    }

    @Transactional
    public void approveProperty(Long propertyId) {
        Property property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        property.setApproved(true);
        property.setStatus("AVAILABLE");
        propertyRepo.save(property);

        // Calculate trust score and trigger AI explanation
        trustService.calculateAndSave(propertyId);
        aiService.generateAndStoreTrustExplanation(propertyId);
    }

    @Transactional
    public void rejectProperty(Long propertyId) {
        Property property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        property.setApproved(false);
        property.setStatus("REJECTED");
        propertyRepo.save(property);

        // Update trust score
        trustService.calculateAndSave(propertyId);
        aiService.generateAndStoreTrustExplanation(propertyId);
    }

    @Transactional
    public void deleteProperty(Long propertyId) {
        propertyRepo.deleteById(propertyId);
    }

    @Transactional
    public void recalculateTrust(Long propertyId) {
        trustService.calculateAndSave(propertyId);
        aiService.generateAndStoreTrustExplanation(propertyId);
    }
}
