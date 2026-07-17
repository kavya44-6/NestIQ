package com.example.project.service;

import com.example.project.entity.Property;
import com.example.project.entity.Review;
import com.example.project.entity.User;
import com.example.project.repository.PropertyRepository;
import com.example.project.repository.ReviewRepository;
import com.example.project.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepo;
    private final PropertyRepository propertyRepo;
    private final UserRepository userRepo;
    private final TrustService trustService;

    public ReviewService(ReviewRepository reviewRepo,
                         PropertyRepository propertyRepo,
                         UserRepository userRepo,
                         TrustService trustService) {
        this.reviewRepo = reviewRepo;
        this.propertyRepo = propertyRepo;
        this.userRepo = userRepo;
        this.trustService = trustService;
    }

    @Transactional
    public Review submitReview(Long propertyId, String customerEmail, Integer rating, String comment) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        Property property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        User customer = userRepo.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (reviewRepo.existsByPropertyIdAndCustomerEmail(propertyId, customerEmail)) {
            throw new RuntimeException("Customer has already reviewed this property");
        }

        Review review = Review.builder()
                .property(property)
                .customer(customer)
                .rating(rating)
                .comment(comment)
                .createdAt(LocalDateTime.now())
                .build();

        Review savedReview = reviewRepo.save(review);
        
        // update the property trust score
        trustService.calculateAndSave(propertyId);

        return savedReview;
    }

    public List<Review> getReviews(Long propertyId) {
        return reviewRepo.findByPropertyId(propertyId);
    }
}
