package com.example.project.service;

import com.example.project.entity.Property;
import com.example.project.entity.User;
import com.example.project.repository.PropertyRepository;
import com.example.project.repository.UserRepository;
import com.example.project.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TrustService {

    private final PropertyRepository propertyRepo;
    private final UserRepository     userRepo;
    private final ReviewRepository   reviewRepo;

    public TrustService(PropertyRepository propertyRepo,
                        UserRepository userRepo,
                        ReviewRepository reviewRepo) {
        this.propertyRepo = propertyRepo;
        this.userRepo     = userRepo;
        this.reviewRepo   = reviewRepo;
    }

    /**
     * Full trust breakdown for a property.
     * Components sum to totalScore; thresholds match the frontend's own
     * fallback logic exactly so admin and customer views always agree.
     *
     * Components (max):
     *   listingQuality       25  — field completeness
     *   agentActivity        20  — agent approval rate
     *   documentVerification 25  — user + agent verified flags
     *   customerReviews      15  — reviews score (max 15)
     *   fraudSignals         15  — rule-based price anomaly (no API key needed)
     *   ─────────────────────────
     *   total               100  (capped at 100)
     */
    public Map<String, Object> getBreakdown(Long propertyId) {
        Property property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found: " + propertyId));

        int listingQuality       = calcListingQuality(property);
        int agentActivity        = calcAgentActivity(property);
        int documentVerification = calcDocumentVerification(property);
        
        Double avgRating = reviewRepo.findAverageRatingByPropertyId(propertyId);
        int customerReviews = 0;
        if (avgRating != null) {
            if (avgRating >= 4.5) customerReviews = 15;
            else if (avgRating >= 3.5) customerReviews = 12;
            else if (avgRating >= 2.5) customerReviews = 8;
            else if (avgRating >= 1.5) customerReviews = 4;
        }

        int fraudSignals         = calcFraudSignals(property);

        int totalScore = listingQuality + agentActivity + documentVerification
                + customerReviews + fraudSignals;
        totalScore = Math.max(0, Math.min(100, totalScore));

        String status;
        String color;
        if (totalScore >= 85) {
            status = "Highly Trusted";
            color  = "#16a34a";
        } else if (totalScore >= 60) {
            status = "Trusted";
            color  = "#d97706";
        } else if (totalScore >= 40) {
            status = "Moderate Trust";
            color  = "#f59e0b";
        } else {
            status = "Low Trust — Verify Before Proceeding";
            color  = "#dc2626";
        }

        // Build a human-readable explanation using only the computed scores
        String explanation = buildExplanation(
                totalScore, listingQuality, agentActivity,
                documentVerification, fraudSignals, property);

        Map<String, Object> result = new HashMap<>();
        result.put("documentVerification",  documentVerification);
        result.put("agentActivity",         agentActivity);
        result.put("customerReviews",       customerReviews);
        result.put("listingQuality",        listingQuality);
        result.put("fraudSignals",          fraudSignals);
        result.put("totalScore",            totalScore);
        result.put("status",                status);
        result.put("color",                 color);
        result.put("explanation",           explanation);
        return result;
    }

    public int getScore(Long propertyId) {
        Map<String, Object> breakdown = getBreakdown(propertyId);
        return (int) breakdown.get("totalScore");
    }

    public void calculateAndSave(Long propertyId) {
        Property property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found: " + propertyId));
        int score = getScore(propertyId);
        property.setTrustScore(score);
        propertyRepo.save(property);
    }

    // ── Component calculations ────────────────────────────────────────────

    /**
     * Listing quality: completeness of key fields, max 25.
     */
    private int calcListingQuality(Property p) {
        int score = 0;
        if (p.getTitle()        != null && !p.getTitle().isBlank())       score += 4;
        if (p.getDescription()  != null && !p.getDescription().isBlank()) score += 5;
        if (p.getPrice()        != null)                                   score += 4;
        if (p.getLocation()     != null && !p.getLocation().isBlank())    score += 3;
        if (p.getCity()         != null && !p.getCity().isBlank())        score += 3;
        if (p.getBhk()          != null && p.getBhk() > 0)               score += 3;
        if (p.getArea()         != null && p.getArea() > 0)              score += 3;
        return Math.min(score, 25);
    }

    /**
     * Agent activity: ratio of approved to total agent listings, max 20.
     * A new agent with no history gets a neutral 10.
     */
    private int calcAgentActivity(Property p) {
        User agent = p.getAgent();
        if (agent == null) return 5;   // owner-listed property — minimal activity score

        long total    = propertyRepo.countByAgentId(agent.getId());
        long approved = propertyRepo.countByAgentIdAndApprovedTrue(agent.getId());
        long rejected = propertyRepo.countByAgentIdAndStatus(agent.getId(), "REJECTED");

        if (total == 0) return 10;   // new agent, neutral

        double approvalRate = (double) approved / total;
        int score = (int) (approvalRate * 20);

        // Penalty for rejections: -2 per rejected listing, max -6
        score -= (int) Math.min(rejected * 2, 6);

        return Math.max(0, Math.min(score, 20));
    }

    /**
     * Document / identity verification, max 25.
     * Based on User.verified and Property.agentVerified.
     */
    private int calcDocumentVerification(Property p) {
        User owner = p.getOwner();
        User agent = p.getAgent();

        if (owner != null) {
            String status = owner.getKycStatus();
            if ("VERIFIED".equals(status)) return 25;
            if ("SUBMITTED".equals(status)) return 15;
            return 5;
        }

        if (agent != null) {
            String status = agent.getKycStatus();
            boolean isAgentVerified = "VERIFIED".equals(status) || Boolean.TRUE.equals(p.getAgentVerified());
            if (isAgentVerified && "VERIFIED".equals(status)) return 25;
            if ("SUBMITTED".equals(status) || isAgentVerified) return 15;
            return 5;
        }

        return 5;
    }

    /**
     * Fraud signal score — rule-based price anomaly check, max 15.
     * Higher score = less suspicious = more trusted.
     *
     * Algorithm (no API key required):
     *   1. Find all approved listings in the same city + BHK.
     *   2. Compute average price.
     *   3. If the listed price is >40% BELOW average → likely fraudulent → score 0.
     *      If the listed price is >30% BELOW average → suspicious → score 5.
     *      Otherwise → clean → score 15.
     *
     * Edge case: fewer than 2 comparable properties → neutral score 10.
     */
    private int calcFraudSignals(Property p) {
        try {
            if (p.getCity() == null || p.getBhk() == null || p.getPrice() == null) {
                return 10; // insufficient data — neutral
            }

            List<Property> similar = propertyRepo.findByCityAndBhkAndApprovedTrue(p.getCity(), p.getBhk());
            // Exclude the property itself
            similar = similar.stream()
                    .filter(s -> !s.getId().equals(p.getId()))
                    .toList();

            if (similar.size() < 2) {
                return 10; // not enough data — neutral
            }

            double avg        = similar.stream().mapToDouble(Property::getPrice).average().orElse(p.getPrice());
            double percentOff = ((avg - p.getPrice()) / avg) * 100; // positive = listed BELOW market

            if (percentOff > 40) return 0;   // >40% below market — strong fraud signal
            if (percentOff > 30) return 5;   // >30% below market — suspicious
            return 15;                        // normal pricing — clean
        } catch (Exception e) {
            return 15; // graceful fallback — never block the trust score on an error
        }
    }

    // ── Rule-based explanation ────────────────────────────────────────────

    /**
     * Generates a human-readable trust explanation using only computed scores.
     * No AI API key required. Rich enough for demo / review.
     */
    private String buildExplanation(int total, int lq, int aa, int dv, int fs, Property p) {
        long agentTotal    = p.getAgent() != null ? propertyRepo.countByAgentId(p.getAgent().getId()) : 0;
        long agentApproved = p.getAgent() != null ? propertyRepo.countByAgentIdAndApprovedTrue(p.getAgent().getId()) : 0;
        int  approvalRate  = agentTotal > 0 ? (int)((double) agentApproved / agentTotal * 100) : 0;

        String fraudText = fs == 15 ? "No pricing anomalies detected."
                         : fs ==  5 ? "Price is significantly below market average — verify details."
                                    : "Price is far below market average — high fraud risk.";

        return String.format(
            "This property scores %d/100. " +
            "Listing quality: %d/25 (%s). " +
            "Agent activity: %d/20 (approval rate %d%%). " +
            "Document verification: %d/25 (%s). " +
            "Fraud signals: %d/15 — %s",
            total,
            lq,  lq >= 20 ? "complete details provided" : lq >= 12 ? "most details present" : "incomplete listing",
            aa,  approvalRate,
            dv,  dv == 25 ? "fully verified" : dv == 15 ? "partially verified" : "not yet verified",
            fs,  fraudText
        );
    }
}
