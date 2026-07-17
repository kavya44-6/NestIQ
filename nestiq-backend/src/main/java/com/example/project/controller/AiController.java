package com.example.project.controller;

import com.example.project.dto.*;
import com.example.project.entity.Property;
import com.example.project.repository.PropertyRepository;
import com.example.project.service.AiService;
import com.example.project.service.EmbeddingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final EmbeddingService embeddingService;
    private final PropertyRepository propertyRepository;

    public AiController(AiService aiService, EmbeddingService embeddingService, PropertyRepository propertyRepository) {
        this.aiService = aiService;
        this.embeddingService = embeddingService;
        this.propertyRepository = propertyRepository;
    }

    // ── 1. Property chat — body-based (legacy, kept for backward compat) ──
    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest req) {
        return ResponseEntity.ok(aiService.chat(req));
    }

    // ── 2. Property chat — path-variable (frontend calls this) ────────────
    @PostMapping("/chat/{propertyId}")
    public ResponseEntity<AiChatResponse> chatByPath(
            @PathVariable Long propertyId,
            @RequestBody  Map<String, Object> body) {

        AiChatRequest req = new AiChatRequest();
        req.setPropertyId(propertyId);
        req.setMessage((String) body.get("message"));

        Object historyRaw = body.get("history");
        if (historyRaw instanceof List<?>) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> history = (List<Map<String, Object>>) historyRaw;
            req.setHistory(history);
        }

        return ResponseEntity.ok(aiService.chat(req));
    }

    // ── 3. Semantic recommendations ───────────────────────────────────────
    @PostMapping("/recommend")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AiRecommendResponse>> recommend(@RequestBody AiRecommendRequest req) {
        return ResponseEntity.ok(aiService.recommendProperties(req));
    }

    // ── 4. Fair price comparison ──────────────────────────────────────────
    @GetMapping("/fair-price/{propertyId}")
    public ResponseEntity<?> fairPrice(@PathVariable Long propertyId) {
        try {
            return ResponseEntity.ok(aiService.fairPrice(propertyId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── 5. Trust breakdown ─────────────────────────────────────────────
    @GetMapping("/trust/{propertyId}")
    public ResponseEntity<?> trustBreakdown(@PathVariable Long propertyId) {
        try {
            return ResponseEntity.ok(aiService.trustBreakdown(propertyId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── 6. Claude trust explanation (async trigger) ───────────────────────
    @PostMapping("/explain-trust/{propertyId}")
    public ResponseEntity<?> explainTrust(@PathVariable Long propertyId) {
        try {
            String explanation = aiService.getOrTriggerExplanation(propertyId);
            return ResponseEntity.ok(Map.of("explanation", explanation));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── 7. AI Description Generator ───────────────────────────────────────
    @PostMapping("/generate-description")
    public ResponseEntity<Map<String, String>> generateDescription(@RequestBody PropertyDTO details) {
        return ResponseEntity.ok(Map.of("description", aiService.generateDescription(details)));
    }

    // ── 8. AI Price Estimator ─────────────────────────────────────────────
    @PostMapping("/estimate-price")
    public ResponseEntity<Map<String, Object>> estimatePrice(@RequestBody PropertyDTO details) {
        return ResponseEntity.ok(aiService.estimatePrice(details));
    }

    // ── 9. New Authenticated Price Predictor ──────────────────────────────
    @PostMapping("/predict-price")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> predictPrice(@RequestBody Map<String, Object> req) {
        try {
            PropertyDTO details = new PropertyDTO();
            details.setCity((String) req.get("city"));
            details.setLocation((String) req.get("district"));
            
            Number bhkVal = (Number) req.get("bhk");
            details.setBhk(bhkVal != null ? bhkVal.intValue() : 2);
            
            Number areaVal = (Number) req.get("area");
            details.setArea(areaVal != null ? areaVal.doubleValue() : 1000.0);
            
            details.setFurnishing((String) req.get("furnished"));
            
            Boolean hasParking = (Boolean) req.get("parking");
            if (hasParking != null && hasParking) {
                details.setAmenities(List.of("Parking"));
            } else {
                details.setAmenities(List.of());
            }
            
            details.setListingType("RENT"); 
            
            Map<String, Object> result = aiService.estimatePrice(details);
            
            double estimatedMin = ((Number) result.get("estimatedMin")).doubleValue();
            double estimatedMax = ((Number) result.get("estimatedMax")).doubleValue();
            double predictedRent = (estimatedMin + estimatedMax) / 2.0; 
            
            String explanation = (String) result.get("explanation");
            String source = explanation != null && explanation.contains("RandomForestRegressor") ? "python" : "java-fallback";
            
            Map<String, Object> response = Map.of(
                "predicted_rent", Math.round(predictedRent),
                "engine", "python".equals(source) ? "RandomForestRegressor" : "Rule-based Math Model",
                "source", source
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @GetMapping("/duplicate-check/{propertyId}")
    @PreAuthorize("isAuthenticated()")  
    public ResponseEntity<?> checkDuplicate(@PathVariable Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        int duplicateCount = embeddingService.countDuplicates(property);
        String status;
        String message;
        String color;
        if (duplicateCount == 0) {
            status = "UNIQUE";
            message = "This listing appears to be unique on our platform.";
            color = "green";
        } else if (duplicateCount <= 2) {
            status = "SIMILAR";
            message = duplicateCount + " similar listing(s) found from other agents. Verify details before proceeding.";
            color = "orange";
        } else {
            status = "DUPLICATE_RISK";
            message = duplicateCount + " highly similar listings detected. This may be a duplicate listing. Exercise extreme caution.";
            color = "red";
        }
        return ResponseEntity.ok(Map.of("status", status, "message", message, "color", color, "count", duplicateCount));
    }

    @GetMapping("/market-analysis/{city}")
    public ResponseEntity<?> getMarketAnalysis(@PathVariable String city) {
        try {
            return ResponseEntity.ok(aiService.getMarketAnalysis(city));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
