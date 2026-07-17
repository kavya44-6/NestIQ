package com.example.project.controller;

import com.example.project.entity.Review;
import com.example.project.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<?> submitReview(Authentication auth, @RequestBody Map<String, Object> body) {
        try {
            Long propertyId = Long.valueOf(body.get("propertyId").toString());
            Integer rating = Integer.valueOf(body.get("rating").toString());
            String comment = (String) body.get("comment");

            Review review = reviewService.submitReview(propertyId, auth.getName(), rating, comment);
            
            Map<String, Object> res = new HashMap<>();
            res.put("id", review.getId());
            res.put("propertyId", review.getProperty().getId());
            res.put("customerName", review.getCustomer().getName());
            res.put("customerEmail", review.getCustomer().getEmail());
            res.put("rating", review.getRating());
            res.put("comment", review.getComment());
            res.put("createdAt", review.getCreatedAt());

            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{propertyId}")
    public ResponseEntity<?> getReviews(@PathVariable Long propertyId) {
        try {
            List<Review> reviews = reviewService.getReviews(propertyId);
            List<Map<String, Object>> list = reviews.stream().map(r -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", r.getId());
                map.put("propertyId", r.getProperty().getId());
                map.put("customerName", r.getCustomer().getName());
                map.put("customerEmail", r.getCustomer().getEmail());
                map.put("rating", r.getRating());
                map.put("comment", r.getComment());
                map.put("createdAt", r.getCreatedAt());
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
