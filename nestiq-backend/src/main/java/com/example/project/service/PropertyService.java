package com.example.project.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.dto.PropertyDTO;
import com.example.project.entity.Property;
import com.example.project.entity.User;
import com.example.project.entity.Role;
import com.example.project.repository.PropertyRepository;
import com.example.project.repository.UserRepository;

@Service
@Transactional
public class PropertyService {

    private final PropertyRepository propertyRepo;
    private final UserRepository     userRepo;
    private final EmbeddingService   embeddingService;
    private final EmailService       emailService;
    private final TrustService       trustService;
    private final AiService          aiService;
    private final NotificationService notificationService;

    public PropertyService(PropertyRepository propertyRepo,
                           UserRepository userRepo,
                           @Lazy EmbeddingService embeddingService,
                           EmailService emailService,
                           @Lazy TrustService trustService,
                           @Lazy AiService aiService,
                           NotificationService notificationService) {
        this.propertyRepo     = propertyRepo;
        this.userRepo         = userRepo;
        this.embeddingService = embeddingService;
        this.emailService     = emailService;
        this.trustService     = trustService;
        this.aiService         = aiService;
        this.notificationService = notificationService;
    }

    // ── Public ────────────────────────────────────────────────────────────
    public List<PropertyDTO> getPublicProperties(List<String> cities, String listingType,
                                                  List<Integer> bhks, Double minPrice,
                                                  Double maxPrice, String propertyType, String sortBy) {
        List<Property> all = propertyRepo.findByApprovedTrue();

        return all.stream()
                .filter(p -> !"SOLD".equalsIgnoreCase(p.getStatus()) && !"RENTED".equalsIgnoreCase(p.getStatus()))
                .filter(p -> {
                    String reqStatus = p.getAgentRequestStatus();
                    if (reqStatus == null || reqStatus.isBlank()) return true;
                    if ("SELF_SELL".equals(reqStatus)) return true;
                    if ("ASSIGNED".equals(reqStatus)) return true;
                    if ("OPEN".equals(reqStatus) && p.getAgent() != null) return true;
                    return false;
                })
                .filter(p -> cities == null || cities.isEmpty() || cities.stream().anyMatch(c -> c.equalsIgnoreCase(p.getCity())))
                .filter(p -> listingType == null || listingType.isBlank() || listingType.equalsIgnoreCase(p.getListingType()))
                .filter(p -> bhks == null || bhks.isEmpty() || bhks.contains(p.getBhk()))
                .filter(p -> minPrice == null || (p.getPrice() != null && p.getPrice() >= minPrice))
                .filter(p -> maxPrice == null || (p.getPrice() != null && p.getPrice() <= maxPrice))
                .filter(p -> propertyType == null || propertyType.isBlank() || propertyType.equalsIgnoreCase(p.getPropertyType()))
                .sorted((a, b) -> {
                    if ("price_asc".equalsIgnoreCase(sortBy)) {
                        return Double.compare(a.getPrice() != null ? a.getPrice() : 0.0, b.getPrice() != null ? b.getPrice() : 0.0);
                    } else if ("price_desc".equalsIgnoreCase(sortBy)) {
                        return Double.compare(b.getPrice() != null ? b.getPrice() : 0.0, a.getPrice() != null ? a.getPrice() : 0.0);
                    } else if ("newest".equalsIgnoreCase(sortBy)) {
                        LocalDateTime ta = a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.MIN;
                        LocalDateTime tb = b.getCreatedAt() != null ? b.getCreatedAt() : LocalDateTime.MIN;
                        return tb.compareTo(ta);
                    } else { // default or "trust"
                        int scoreA = a.getTrustScore() != null ? a.getTrustScore() : 0;
                        int scoreB = b.getTrustScore() != null ? b.getTrustScore() : 0;
                        return Integer.compare(scoreB, scoreA);
                    }
                })
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PropertyDTO getPublicProperty(Long id) {
        return toDTO(propertyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found: " + id)));
    }

    // ── Agent ─────────────────────────────────────────────────────────────
    public List<PropertyDTO> getMyProperties(String email) {
        User agent = getUser(email);
        return propertyRepo.findByAgentId(agent.getId())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public PropertyDTO create(String email, PropertyDTO req) {
        User agent = getUser(email);
        if (agent.getRole() != Role.AGENT) {
            throw new RuntimeException("Only AGENT users can list properties via this portal.");
        }
        String amenitiesStr = null;
        if (req.getAmenities() != null && !req.getAmenities().isEmpty()) {
            amenitiesStr = String.join(",", req.getAmenities());
        }

        Property p = Property.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .price(req.getPrice())
                .location(req.getLocation())
                .city(req.getCity())
                .bhk(req.getBhk())
                .bathrooms(req.getBathrooms())
                .area(req.getArea())
                .propertyType(req.getPropertyType())
                .listingType(req.getListingType() != null ? req.getListingType() : "RENT")
                .status(req.getStatus() != null ? req.getStatus() : "AVAILABLE")
                .imageUrl(req.getImageUrl())
                .trustScore(calcTrust(req))
                .agentName(agent.getName())
                .agentEmail(agent.getEmail())
                .agentPhone(agent.getPhone())
                .agentVerified("VERIFIED".equals(agent.getKycStatus()))
                .sellerCompany(req.getSellerCompany())
                .sellerPhone(req.getSellerPhone())
                .sellerEmail(req.getSellerEmail())
                .furnishing(req.getFurnishing())
                .facing(req.getFacing())
                .floor(req.getFloor())
                .totalFloors(req.getTotalFloors())
                .amenities(amenitiesStr)
                .reraNumber(req.getReraNumber())
                .reraRequired(req.getReraRequired())
                .floorPlanImage(req.getFloorPlanImage())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .nearbyLandmarks(req.getNearbyLandmarks())
                .approved(true)   // agent-created listings are immediately visible
                .agent(agent)
                .build();

        Property saved = propertyRepo.save(p);
        try {
            trustService.calculateAndSave(saved.getId());
            saved = propertyRepo.findById(saved.getId()).orElse(saved);
        } catch (Exception e) {}
        embeddingService.storeEmbeddingAsync(saved);
        return toDTO(saved);
    }

    public PropertyDTO update(String email, Long id, PropertyDTO req) {
        Property p = propertyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        User user = getUser(email);
        if (user.getRole() != Role.AGENT) {
            throw new RuntimeException("Only AGENT users can update properties.");
        }
        if (p.getAgent() == null || !p.getAgent().getEmail().equals(email)) throw new RuntimeException("Not authorised");

        if (req.getTitle()        != null) p.setTitle(req.getTitle());
        if (req.getDescription()  != null) p.setDescription(req.getDescription());
        if (req.getPrice()        != null) p.setPrice(req.getPrice());
        if (req.getLocation()     != null) p.setLocation(req.getLocation());
        if (req.getCity()         != null) p.setCity(req.getCity());
        if (req.getBhk()          != null) p.setBhk(req.getBhk());
        if (req.getBathrooms()    != null) p.setBathrooms(req.getBathrooms());
        if (req.getArea()         != null) p.setArea(req.getArea());
        if (req.getPropertyType() != null) p.setPropertyType(req.getPropertyType());
        if (req.getListingType()  != null) p.setListingType(req.getListingType());
        if (req.getStatus()       != null) p.setStatus(req.getStatus());
        if (req.getImageUrl()     != null) p.setImageUrl(req.getImageUrl());
        if (req.getSellerCompany()!= null) p.setSellerCompany(req.getSellerCompany());
        if (req.getSellerPhone()  != null) p.setSellerPhone(req.getSellerPhone());
        if (req.getSellerEmail()  != null) p.setSellerEmail(req.getSellerEmail());
        if (req.getFurnishing()   != null) p.setFurnishing(req.getFurnishing());
        if (req.getFacing()       != null) p.setFacing(req.getFacing());
        if (req.getFloor()        != null) p.setFloor(req.getFloor());
        if (req.getTotalFloors()  != null) p.setTotalFloors(req.getTotalFloors());
        if (req.getReraNumber()   != null) p.setReraNumber(req.getReraNumber());
        if (req.getReraRequired() != null) p.setReraRequired(req.getReraRequired());
        if (req.getFloorPlanImage() != null) p.setFloorPlanImage(req.getFloorPlanImage());
        if (req.getLatitude()     != null) p.setLatitude(req.getLatitude());
        if (req.getLongitude()    != null) p.setLongitude(req.getLongitude());
        if (req.getNearbyLandmarks() != null) p.setNearbyLandmarks(req.getNearbyLandmarks());
        p.setTrustScore(calcTrust(req));

        if (req.getAmenities() != null) {
            p.setAmenities(String.join(",", req.getAmenities()));
        }

        Property saved = propertyRepo.save(p);
        try {
            trustService.calculateAndSave(saved.getId());
            saved = propertyRepo.findById(saved.getId()).orElse(saved);
        } catch (Exception e) {}
        embeddingService.storeEmbeddingAsync(saved);
        return toDTO(saved);
    }

    public void delete(String email, Long id) {
        Property p = propertyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        User user = getUser(email);
        if (user.getRole() != Role.AGENT) {
            throw new RuntimeException("Only AGENT users can delete properties.");
        }
        if (p.getAgent() == null || !p.getAgent().getEmail().equals(email)) throw new RuntimeException("Not authorised");
        propertyRepo.delete(p);
    }

    public PropertyDTO updateStatus(String email, Long id, String status) {
        Property p = propertyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found: " + id));

        // Authorisation: check if agent is updating and matches
        if (p.getAgent() != null && !p.getAgent().getEmail().equals(email)) {
            throw new RuntimeException("Not authorised");
        } else if (p.getAgent() == null && p.getOwner() != null && !p.getOwner().getEmail().equals(email)) {
            throw new RuntimeException("Not authorised");
        }

        p.setStatus(status);
        Property saved = propertyRepo.save(p);
        return toDTO(saved);
    }

    // ── Owner-created properties ──────────────────────────────────────────
    public PropertyDTO createAsOwner(String email, PropertyDTO req) {
        User owner = getUser(email);
        String amenitiesStr = null;
        if (req.getAmenities() != null && !req.getAmenities().isEmpty()) {
            amenitiesStr = String.join(",", req.getAmenities());
        }

        Property p = Property.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .price(req.getPrice())
                .location(req.getLocation())
                .city(req.getCity())
                .bhk(req.getBhk())
                .bathrooms(req.getBathrooms())
                .area(req.getArea())
                .propertyType(req.getPropertyType())
                .listingType(req.getListingType() != null ? req.getListingType() : "RENT")
                .status("AVAILABLE")
                .imageUrl(req.getImageUrl())
                .trustScore(calcTrust(req))
                .agentName(owner.getName())  // owner's name shown as lister
                .agentEmail(owner.getEmail())
                .sellerCompany(req.getSellerCompany())
                .sellerPhone(req.getSellerPhone())
                .sellerEmail(req.getSellerEmail())
                .furnishing(req.getFurnishing())
                .facing(req.getFacing())
                .floor(req.getFloor())
                .totalFloors(req.getTotalFloors())
                .amenities(amenitiesStr)
                .floorPlanImage(req.getFloorPlanImage())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .nearbyLandmarks(req.getNearbyLandmarks())
                .approved(true)  // owner listings are auto-approved
                .owner(owner)
                .build();

        Property saved = propertyRepo.save(p);
        try {
            trustService.calculateAndSave(saved.getId());
            saved = propertyRepo.findById(saved.getId()).orElse(saved);
        } catch (Exception e) {}
        embeddingService.storeEmbeddingAsync(saved);
        return toDTO(saved);
    }

    // ── Open requests (owner listed, no agent yet) ───────────────────────
    public List<PropertyDTO> getOpenRequests() {
        return propertyRepo.findAll().stream()
                .filter(p -> "OPEN".equals(p.getAgentRequestStatus())
                        && p.getAgent() == null
                        && Boolean.TRUE.equals(p.getApproved())
                        && Boolean.TRUE.equals(p.getAvailable()))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Agent accepts management of an open property
    public PropertyDTO acceptAssignment(Long propertyId) {
        User agent = getCurrentUser();
        Property property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found: " + propertyId));
        if (!"OPEN".equals(property.getAgentRequestStatus())) {
            throw new RuntimeException("This property is no longer available.");
        }
        property.setAgent(agent);
        property.setAgentName(agent.getName());
        property.setAgentEmail(agent.getEmail());
        property.setAgentPhone(agent.getPhone());
        property.setAgentVerified("VERIFIED".equals(agent.getKycStatus()));
        property.setAgentRequestStatus("ASSIGNED");
        
        Property saved = propertyRepo.save(property);
        
        if (saved.getOwner() != null) {
            emailService.sendAgentAssignedToOwner(
                saved.getOwner().getEmail(),
                saved.getOwner().getName(),
                saved.getTitle(),
                agent.getName(),
                agent.getPhone(),
                agent.getEmail());

            emailService.sendAssignmentConfirmedToAgent(
                agent.getEmail(),
                agent.getName(),
                saved.getTitle(),
                saved.getCity(),
                saved.getOwner().getName(),
                saved.getOwner().getPhone());

            // Real-time notification trigger
            notificationService.sendNotification(
                saved.getOwner().getId(),
                "Agent " + agent.getName() + " has accepted management of your property: " + saved.getTitle(),
                "ASSIGNMENT",
                "/owner/properties"
            );
        }

        return toDTO(saved);
    }

    public PropertyDTO addOwnerProperty(PropertyDTO dto, User owner) {
        String reqStatus = Boolean.TRUE.equals(dto.getSelfSell()) ? "SELF_SELL" : "OPEN";
        
        Integer bhk = dto.getBedrooms() != null ? dto.getBedrooms() : dto.getBhk();
        String address = dto.getAddress() != null ? dto.getAddress() : dto.getLocation();

        String amenitiesStr = null;
        if (dto.getAmenities() != null && !dto.getAmenities().isEmpty()) {
            amenitiesStr = String.join(",", dto.getAmenities());
        }

        Property p = Property.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .city(dto.getCity())
                .location(address)
                .propertyType(dto.getPropertyType())
                .listingType(dto.getListingType() != null ? dto.getListingType() : "RENT")
                .furnishing(dto.getFurnishing())
                .bhk(bhk)
                .bathrooms(dto.getBathrooms())
                .area(dto.getArea())
                .price(dto.getPrice())
                .imageUrl(dto.getImageUrl())
                .approved(true)
                .available(true)
                .trustScore(0)
                .agentRequestStatus(reqStatus)
                .owner(owner)
                .amenities(amenitiesStr)
                .reraNumber(dto.getReraNumber())
                .reraRequired(dto.getReraRequired())
                .build();
        Property saved = propertyRepo.save(p);
        trustService.calculateAndSave(saved.getId());
        aiService.generateAndStoreTrustExplanation(saved.getId());
        return toDTO(saved);
    }

    // ── Used by AiOrchestrationService ────────────────────────────────────
    public PropertyDTO getPublicPropertyDto(Long id) {
        return getPublicProperty(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User is not authenticated");
        }
        String email = auth.getName();
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private int calcTrust(PropertyDTO r) {
        int s = 0;
        if (r.getTitle()        != null && !r.getTitle().isBlank())       s += 15;
        if (r.getDescription()  != null && !r.getDescription().isBlank()) s += 20;
        if (r.getPrice()        != null)                                   s += 15;
        if (r.getLocation()     != null && !r.getLocation().isBlank())    s += 10;
        if (r.getCity()         != null && !r.getCity().isBlank())        s += 10;
        if (r.getBhk()          != null && r.getBhk() > 0)               s += 10;
        if (r.getArea()         != null && r.getArea() > 0)              s += 10;
        if (r.getPropertyType() != null && !r.getPropertyType().isBlank()) s += 10;
        return Math.min(s, 100);
    }

    private PropertyDTO toDTO(Property p) {
        if (p == null) return null;
        PropertyDTO dto = PropertyDTO.from(p);
        dto.setAgentRequestStatus(p.getAgentRequestStatus());
        dto.setFurnishing(p.getFurnishing());
        dto.setOwnerId(p.getOwner() != null ? p.getOwner().getId() : null);
        dto.setOwnerName(p.getOwner() != null ? p.getOwner().getName() : null);
        dto.setInquiryCount(p.getInquiries() != null ? p.getInquiries().size() : 0);
        dto.setVisitCount(p.getVisits() != null ? p.getVisits().size() : 0);
        return dto;
    }
}