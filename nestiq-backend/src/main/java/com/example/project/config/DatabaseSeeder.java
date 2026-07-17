package com.example.project.config;

import com.example.project.entity.Property;
import com.example.project.entity.Role;
import com.example.project.entity.User;
import com.example.project.repository.PropertyRepository;
import com.example.project.repository.UserRepository;
import com.example.project.repository.PropertyEmbeddingRepository;
import com.example.project.repository.InquiryRepository;
import com.example.project.repository.VisitRepository;
import com.example.project.repository.ReviewRepository;
import com.example.project.repository.OwnerMessageRepository;
import com.example.project.service.TrustService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@Transactional
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final PropertyRepository propertyRepo;
    private final PasswordEncoder encoder;
    private final TrustService trustService;
    private final PropertyEmbeddingRepository embeddingRepo;
    private final InquiryRepository inquiryRepo;
    private final VisitRepository visitRepo;
    private final ReviewRepository reviewRepo;
    private final OwnerMessageRepository ownerMessageRepo;

    public DatabaseSeeder(UserRepository userRepo, 
                          PropertyRepository propertyRepo, 
                          PasswordEncoder encoder, 
                          TrustService trustService,
                          PropertyEmbeddingRepository embeddingRepo,
                          InquiryRepository inquiryRepo,
                          VisitRepository visitRepo,
                          ReviewRepository reviewRepo,
                          OwnerMessageRepository ownerMessageRepo) {
        this.userRepo = userRepo;
        this.propertyRepo = propertyRepo;
        this.encoder = encoder;
        this.trustService = trustService;
        this.embeddingRepo = embeddingRepo;
        this.inquiryRepo = inquiryRepo;
        this.visitRepo = visitRepo;
        this.reviewRepo = reviewRepo;
        this.ownerMessageRepo = ownerMessageRepo;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== Running NestIQ Database Seeder ===");

        if (userRepo.findByEmail("arjun@test.com").isEmpty()) {
            System.out.println("Seeding Customer: arjun@test.com");
            User customer = User.builder()
                    .name("Arjun Kumar")
                    .email("arjun@test.com")
                    .password(encoder.encode("password"))
                    .role(Role.CUSTOMER)
                    .phone("9876543210")
                    .verified(true)
                    .kycStatus("NONE")
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepo.save(customer);
        }

        if (userRepo.findByEmail("sara@test.com").isEmpty()) {
            System.out.println("Seeding Agent: sara@test.com");
            User agent = User.builder()
                    .name("Sara John")
                    .email("sara@test.com")
                    .password(encoder.encode("password"))
                    .role(Role.AGENT)
                    .phone("9876543211")
                    .verified(true)
                    .kycStatus("VERIFIED")
                    .kycDocumentType("RERA_ID")
                    .kycDocumentNumber("TN/RERA/AG/2024/0129")
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepo.save(agent);
        }

        if (userRepo.findByEmail("owner@test.com").isEmpty()) {
            System.out.println("Seeding Owner: owner@test.com");
            User owner = User.builder()
                    .name("Property Owner")
                    .email("owner@test.com")
                    .password(encoder.encode("password"))
                    .role(Role.OWNER)
                    .phone("9876543212")
                    .verified(true)
                    .kycStatus("VERIFIED")
                    .kycDocumentType("PAN")
                    .kycDocumentNumber("ABCDE1234F")
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepo.save(owner);
        }

        if (userRepo.findByEmail("admin@nestiq.com").isEmpty()) {
            System.out.println("Seeding Admin: admin@nestiq.com");
            User admin = User.builder()
                    .name("NestIQ Admin")
                    .email("admin@nestiq.com")
                    .password(encoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .phone("9876543213")
                    .verified(true)
                    .kycStatus("VERIFIED")
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepo.save(admin);
        }

        if (userRepo.findByEmail("pending.agent@test.com").isEmpty()) {
            System.out.println("Seeding Pending Agent: pending.agent@test.com");
            User pendingAgent = User.builder()
                    .name("Karthik Raja")
                    .email("pending.agent@test.com")
                    .password(encoder.encode("password"))
                    .role(Role.AGENT)
                    .phone("9876543214")
                    .verified(false)
                    .kycStatus("SUBMITTED")
                    .kycDocumentType("PAN")
                    .kycDocumentNumber("ABCDE1234F")
                    .createdAt(LocalDateTime.now())
                    .build();
            userRepo.save(pendingAgent);
        }

        if (propertyRepo.count() < 10) {
            embeddingRepo.deleteAll();
            inquiryRepo.deleteAll();
            visitRepo.deleteAll();
            reviewRepo.deleteAll();
            ownerMessageRepo.deleteAll();
            propertyRepo.deleteAll();
            System.out.println("=== Seeding Initial Property Listings ===");

            User agent = userRepo.findByEmail("sara@test.com").orElse(null);
            User owner = userRepo.findByEmail("owner@test.com").orElse(null);

            String[] cities = {"Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Erode", "Tiruppur"};

            String[][] localities = {
                {"Adyar", "Velachery", "OMR Karapakkam", "Anna Nagar West", "Injambakkam ECR", "Besant Nagar"},
                {"Saravanampatti", "RS Puram", "Peelamedu", "Race Course Road", "Gandhipuram", "Saibaba Colony"},
                {"KK Nagar East", "Anna Nagar Madurai", "Tallakulam", "Othakadai", "Mattuthavani"},
                {"Thillai Nagar", "Cantonment", "Srirangam", "Kattur Road"},
                {"Alagapuram", "Fairlands", "Meyyanur", "Junction Area"},
                {"Perundurai Road", "Moolapalayam", "Kollampalayam"},
                {"Avinashi Road", "Khaderpet Area", "Dharapuram Road"}
            };

            double[] baseLat = {13.0827, 11.0168, 9.9252, 10.7905, 11.6643, 11.3410, 11.1085};
            double[] baseLng = {80.2707, 76.9558, 78.1198, 78.7047, 78.1460, 77.7172, 77.3411};

            String[][] landmarks = {
                {"Tidel Park, OMR", "Marina Beach", "Phoenix Marketcity", "Anna Nagar Tower Park", "IIT Madras campus"},
                {"PSG Tech, Peelamedu", "Codissia Trade Center", "Fun Republic Mall", "Coimbatore Airport", "Race Course Park"},
                {"Mattuthavani Bus Stand", "Meenakshi Amman Temple", "High Court Bench Area", "Madurai Junction"},
                {"Srirangam Ranganathaswamy Temple", "NIT Trichy campus", "Chatram Bus Stand", "Rockfort Temple"},
                {"Salem Junction Railway Station", "Shevaroy Hills Viewpoint", "Sona College grounds", "New Bus Stand"},
                {"Erode Railway Junction", "Texvalley Mall", "Erode Collectorate", "Government Hospital"},
                {"Tiruppur Railway Station", "Nethaji Apparel Park", "New Bus Stand", "Avinashi Temple"}
            };

            int propIndex = 1;

            String[] apartmentImages = {
                "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80",
                "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
                "https://images.unsplash.com/photo-1502005229762-fc1b2d812ca7?w=800&q=80",
                "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=800&q=80"
            };

            String[] villaImages = {
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
                "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
                "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
                "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
            };

            String[] houseImages = {
                "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
                "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=800&q=80",
                "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80",
                "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80"
            };

            String[] plotImages = {
                "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80",
                "https://images.unsplash.com/photo-1444653300606-18560104723b?w=800&q=80"
            };

            for (int i = 0; i < cities.length; i++) {
                String city = cities[i];
                String[] localList = localities[i];
                String[] lmrkList = landmarks[i];
                double lat = baseLat[i];
                double lng = baseLng[i];

                double cityMultiplier = 1.0;
                if (city.equalsIgnoreCase("Chennai")) cityMultiplier = 1.45;
                else if (city.equalsIgnoreCase("Coimbatore")) cityMultiplier = 1.20;
                else if (city.equalsIgnoreCase("Madurai")) cityMultiplier = 0.95;
                else if (city.equalsIgnoreCase("Trichy")) cityMultiplier = 0.85;
                else if (city.equalsIgnoreCase("Salem")) cityMultiplier = 0.75;
                else if (city.equalsIgnoreCase("Erode")) cityMultiplier = 0.70;
                else if (city.equalsIgnoreCase("Tiruppur")) cityMultiplier = 0.80;

                for (int j = 0; j < 7; j++) {
                    if (propIndex > 45) break;

                    String locality = localList[j % localList.length];
                    String landmark = lmrkList[j % lmrkList.length] + ", " + lmrkList[(j + 1) % lmrkList.length];

                    int bhk = ((j + i) % 3) + 1; // Shifting BHK sequence for each city to avoid duplicates
                    String propertyType = "Apartment";
                    if (j == 3) propertyType = "Villa";
                    else if (j == 4) propertyType = "Independent House";
                    else if (j == 5) propertyType = "Plot";
                    else if (j == 6) propertyType = "Duplex";

                    double area = 600.0 + (bhk * 400.0) + (propertyType.equals("Villa") || propertyType.equals("Duplex") ? 1000.0 : 0.0);
                    if (propertyType.equals("Plot")) {
                        area = 1200.0 + (j * 200.0);
                    }
                    area += (i * 100) - (j * 50); // Add variance per city and listing

                    String listingType = (j % 2 == 0) ? "SALE" : "RENT";
                    double price = 0;
                    if (listingType.equals("RENT")) {
                        price = (8000.0 + (bhk * 5000.0) + (propertyType.equals("Villa") ? 15000.0 : 0.0)) * cityMultiplier;
                        price += (j * 750.0) - (i * 250.0);
                        price = Math.round(price / 500.0) * 500.0;
                    } else {
                        price = (2500000.0 + (bhk * 2000000.0) + (propertyType.equals("Villa") ? 5000000.0 : 0.0)) * cityMultiplier;
                        if (propertyType.equals("Plot")) {
                            price = (1500000.0 + (j * 300000.0)) * cityMultiplier;
                        }
                        price += (j * 125000.0) - (i * 35000.0);
                        price = Math.round(price / 50000.0) * 50000.0;
                    }

                    String floorPlan = "/floorplans/2bhk.png";
                    if (propertyType.equals("Villa")) floorPlan = "/floorplans/villa.png";
                    else if (propertyType.equals("Duplex")) floorPlan = "/floorplans/duplex.png";
                    else if (bhk == 1) floorPlan = "/floorplans/1bhk.png";
                    else if (bhk == 3) floorPlan = "/floorplans/3bhk.png";

                    String title = bhk + " BHK " + propertyType + " in " + locality;
                    if (propertyType.equals("Plot")) {
                        title = "Premium Residential Plot (" + (int)area + " sqft) in " + locality;
                    }

                    String desc = "Premium real estate opportunity: a well-ventilated " + propertyType + " situated in " + locality + ", " + city + 
                                  ". Surrounded by green landscaping and located close to " + lmrkList[j % lmrkList.length] + ". Features modern amenities and modular components.";

                    String furnishing = (j % 3 == 0) ? "Fully Furnished" : (j % 3 == 1 ? "Semi Furnished" : "Unfurnished");
                    if (propertyType.equals("Plot")) furnishing = "Unfurnished";

                    String facing = (j % 4 == 0) ? "East" : (j % 4 == 1 ? "West" : (j % 4 == 2 ? "North" : "South"));
                    String amenities = "Water Supply 24/7, Security";
                    if (!propertyType.equals("Plot")) {
                        amenities += ", Parking, CCTV" + (j % 2 == 0 ? ", Power Backup" : "") + (j % 3 == 0 ? ", Lift" : "");
                    }

                    String imgUrl = apartmentImages[(i * 7 + j) % apartmentImages.length];
                    if (propertyType.equals("Villa")) {
                        imgUrl = villaImages[(i * 7 + j) % villaImages.length];
                    } else if (propertyType.equals("Independent House") || propertyType.equals("Duplex")) {
                        imgUrl = houseImages[(i * 7 + j) % houseImages.length];
                    } else if (propertyType.equals("Plot")) {
                        imgUrl = plotImages[(i * 7 + j) % plotImages.length];
                    }

                    Property p = Property.builder()
                            .title(title)
                            .description(desc)
                            .price(price)
                            .location(locality)
                            .city(city)
                            .bhk(bhk)
                            .bathrooms(bhk == 1 ? 1 : bhk == 2 ? 2 : 3)
                            .area(area)
                            .propertyType(propertyType)
                            .listingType(listingType)
                            .status("AVAILABLE")
                            .imageUrl(imgUrl)
                            .agent(propIndex % 2 == 0 ? agent : null)
                            .owner(propIndex % 2 != 0 ? owner : null)
                            .agentName(propIndex % 2 == 0 ? (agent != null ? agent.getName() : "Sara John") : (owner != null ? owner.getName() : "Property Owner"))
                            .agentPhone(propIndex % 2 == 0 ? (agent != null ? agent.getPhone() : "9876543211") : (owner != null ? owner.getPhone() : "9876543212"))
                            .agentEmail(propIndex % 2 == 0 ? (agent != null ? agent.getEmail() : "sara@test.com") : (owner != null ? owner.getEmail() : "owner@test.com"))
                            .agentVerified(true)
                            .agentRequestStatus(propIndex % 2 == 0 ? "ASSIGNED" : "SELF_SELL")
                            .furnishing(furnishing)
                            .facing(facing)
                            .floor(propertyType.equals("Villa") || propertyType.equals("Independent House") || propertyType.equals("Plot") ? 0 : (j % 4))
                            .totalFloors(propertyType.equals("Villa") || propertyType.equals("Independent House") ? 2 : (propertyType.equals("Plot") ? 0 : 5))
                            .approved(true)
                            .available(true)
                            .amenities(amenities)
                            .floorPlanImage(floorPlan)
                            .latitude(lat + (j * 0.005) - 0.01)
                            .longitude(lng + (j * 0.005) - 0.01)
                            .nearbyLandmarks(landmark)
                            .createdAt(LocalDateTime.now())
                            .build();

                    propertyRepo.save(p);
                    trustService.calculateAndSave(p.getId());
                    propIndex++;
                }
            }

            System.out.println("=== Database Seeding Completed Successfully! ===");
        }
    }
}
