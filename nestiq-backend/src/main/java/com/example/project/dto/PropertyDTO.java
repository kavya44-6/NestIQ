package com.example.project.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.example.project.entity.Property;

import lombok.Data;

@Data
public class PropertyDTO {

    // Request fields (used when creating/updating)
    private String  title;
    private String  description;
    private Double  price;
    private String  location;
    private String  city;
    private Integer bhk;
    private Integer bathrooms;
    private Double  propertyAge;
    private Double  area;
    private String  propertyType;
    private String  listingType;
    private String  status;
    private String  imageUrl;
    private String  furnishing;
    private String  facing;
    private Integer floor;
    private Integer totalFloors;
    private String  sellerCompany;
    private String  sellerPhone;
    private String  sellerEmail;
    private List<String> amenities;
    private Integer trustScore;
    private String  reraNumber;
    private Boolean reraRequired;
    
    private String  floorPlanImage;
    private Double  latitude;
    private Double  longitude;
    private String  nearbyLandmarks;

    // Response fields (populated from entity)
    private Long          id;
    private String        image;       // alias for imageUrl — frontend uses both
    private String        agentName;
    private String        agentPhone;
    private String        agentEmail;
    private Boolean       agentVerified;
    private Boolean       approved;
    private Long          ownerId;     // populated for owner-listed properties
    private String        ownerName;
    private String        aiExplanation; // Claude-generated trust explanation
    private LocalDateTime createdAt;

    // New Fields
    private String  agentRequestStatus;  // OPEN | ASSIGNED | SELF_SELL
    private Boolean selfSell;            // used in create request to set agentRequestStatus
    private Integer inquiryCount;
    private Integer visitCount;
    private Integer bedrooms;
    private String  address;
    private String  kycStatus;           // NONE | SUBMITTED | VERIFIED

    /** Build a response DTO from an entity. */
    public static PropertyDTO from(Property p) {
        if (p == null) return null;
        PropertyDTO d = new PropertyDTO();
        d.setId(p.getId());
        d.setTitle(p.getTitle());
        d.setDescription(p.getDescription());
        d.setPrice(p.getPrice());
        d.setLocation(p.getLocation());
        d.setCity(p.getCity());
        d.setBhk(p.getBhk());
        d.setBathrooms(p.getBathrooms());
        d.setArea(p.getArea());
        d.setPropertyType(p.getPropertyType());
        d.setListingType(p.getListingType());
        d.setStatus(p.getStatus());
        d.setTrustScore(p.getTrustScore());
        d.setImageUrl(p.getImageUrl());
        d.setImage(p.getImageUrl());      // send as both keys
        d.setAgentName(p.getAgentName());
        d.setAgentPhone(p.getAgentPhone());
        d.setAgentEmail(p.getAgentEmail());
        d.setAgentVerified(p.getAgentVerified());
        d.setSellerCompany(p.getSellerCompany());
        d.setSellerPhone(p.getSellerPhone());
        d.setSellerEmail(p.getSellerEmail());
        d.setFurnishing(p.getFurnishing());
        d.setFacing(p.getFacing());
        d.setFloor(p.getFloor());
        d.setTotalFloors(p.getTotalFloors());
        d.setApproved(p.getApproved());
        d.setCreatedAt(p.getCreatedAt());
        d.setAgentRequestStatus(p.getAgentRequestStatus());
        d.setOwnerId(p.getOwner() != null ? p.getOwner().getId() : null);
        d.setOwnerName(p.getOwner() != null ? p.getOwner().getName() : null);
        d.setInquiryCount(p.getInquiries() != null ? p.getInquiries().size() : 0);
        d.setVisitCount(p.getVisits() != null ? p.getVisits().size() : 0);

        if (p.getOwner() != null) {
            d.setKycStatus(p.getOwner().getKycStatus());
        } else if (p.getAgent() != null) {
            d.setKycStatus(p.getAgent().getKycStatus());
        } else {
            d.setKycStatus("NONE");
        }

        if (p.getAmenities() != null && !p.getAmenities().isBlank()) {
            d.setAmenities(java.util.Arrays.asList(p.getAmenities().split("\\s*,\\s*")));
        } else {
            d.setAmenities(java.util.Collections.emptyList());
        }

        d.setAiExplanation(p.getAiExplanation());
        d.setReraNumber(p.getReraNumber());
        d.setReraRequired(p.getReraRequired());
        d.setFloorPlanImage(p.getFloorPlanImage());
        d.setLatitude(p.getLatitude());
        d.setLongitude(p.getLongitude());
        d.setNearbyLandmarks(p.getNearbyLandmarks());
        return d;
    }
}
