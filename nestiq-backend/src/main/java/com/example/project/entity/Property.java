package com.example.project.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "properties")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double price;

    private String location;
    private String city;
    private Integer bhk;
    private Integer bathrooms;
    private Double area;
    private String propertyType;
    private String listingType;   // RENT | SALE

    @Builder.Default
    private String status = "AVAILABLE";  // AVAILABLE | SOLD | RENTED | REJECTED

    private Integer trustScore;
    private String imageUrl;

    private String reraNumber;
    private Boolean reraRequired;

    // Agent info (denormalised for quick display)
    private String agentName;
    private String agentPhone;
    private String agentEmail;

    @Builder.Default
    private Boolean agentVerified = false;

    // Seller / company info
    private String sellerCompany;
    private String sellerPhone;
    private String sellerEmail;

    // Extra details
    private String furnishing;   // Fully Furnished | Semi-Furnished | Unfurnished
    private String facing;       // East | West | North | South
    private Integer floor;
    private Integer totalFloors;

    private String floorPlanImage;
    private Double latitude;
    private Double longitude;
    @Column(columnDefinition = "TEXT")
    private String nearbyLandmarks;

    @Builder.Default
    @Column(nullable = false)
    private Boolean approved = true;   // true = automatically approved

    @Builder.Default
    private Boolean available = true;

    @Column(columnDefinition = "TEXT")
    private String amenities;   // comma-separated

    // Soft-rejection reason — populated by reject(); null when approved
    private String rejectionReason;

    // AI-generated trust explanation — populated asynchronously at review time
    @Column(columnDefinition = "TEXT")
    private String aiExplanation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private User agent;

    /** Property listed directly by an owner (OWNER role). Nullable — agent-listed properties have no owner. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    // Who manages the sale: OPEN (wants agent), ASSIGNED (agent accepted), SELF_SELL (owner self-manages)
    @Builder.Default
    @Column(name = "agent_request_status")
    private String agentRequestStatus = "OPEN";

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Inquiry> inquiries = new ArrayList<>();

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Visit> visits = new ArrayList<>();

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (approved  == null) approved  = true;
        if (available == null) available = true;
        if (status    == null) status    = "AVAILABLE";
        if (agentRequestStatus == null) agentRequestStatus = "OPEN";
    }
}
