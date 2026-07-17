package com.example.project.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.example.project.dto.AiChatRequest;
import com.example.project.dto.AiChatResponse;
import com.example.project.dto.AiRecommendRequest;
import com.example.project.dto.AiRecommendResponse;
import com.example.project.dto.PropertyDTO;
import com.example.project.entity.Property;
import com.example.project.repository.PropertyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

@Service
@Transactional
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private final PropertyRepository propertyRepo;
    private final PropertyService    propertyService;
    private final GeminiService      geminiService;
    private final RuleBasedFallbackService fallbackService;
    private final EmbeddingService   embeddingService;
    private final TrustService       trustService;
    private final PythonAiClient     pythonAiClient;
    private final OkHttpClient       httpClient;
    private final ObjectMapper       objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiKey;

    public AiService(PropertyRepository propertyRepo,
                     @Lazy PropertyService propertyService,
                     GeminiService geminiService,
                     RuleBasedFallbackService fallbackService,
                     EmbeddingService embeddingService,
                     TrustService trustService,
                     PythonAiClient pythonAiClient) {
        this.propertyRepo     = propertyRepo;
        this.propertyService  = propertyService;
        this.geminiService    = geminiService;
        this.fallbackService  = fallbackService;
        this.embeddingService = embeddingService;
        this.trustService     = trustService;
        this.pythonAiClient   = pythonAiClient;
        this.httpClient       = new OkHttpClient();
        this.objectMapper     = new ObjectMapper();
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AiChatResponse chat(AiChatRequest req) {
        try {
            PropertyDTO property = propertyService.getPublicProperty(req.getPropertyId());
            String reply = fallbackService.chat(property, req.getMessage());
            return new AiChatResponse(reply);
        } catch (Exception e) {
            return new AiChatResponse(
                    "I'm unable to answer right now. Please use the Inquiry form to contact the agent.");
        }
    }

    private JsonNode runPythonScript(String scriptName, Object inputData) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String jsonInput = mapper.writeValueAsString(inputData);

            ProcessBuilder pb = new ProcessBuilder("python3", "../ai-services/" + scriptName);
            Process proc = pb.start();

            try (var os = proc.getOutputStream()) {
                os.write(jsonInput.getBytes());
                os.flush();
            }

            try (var is = proc.getInputStream()) {
                byte[] bytes = is.readAllBytes();
                return mapper.readTree(new String(bytes));
            }
        } catch (Exception e) {
            return null;
        }
    }

    public List<AiRecommendResponse> recommendProperties(AiRecommendRequest req) {
        List<Property> candidates = propertyRepo.findByApprovedTrue();
        if (candidates.isEmpty()) return Collections.emptyList();

        // Try Python ML recommendation
        if (!candidates.isEmpty()) {
            try {
                // Build user preferences map for Python
                int derivedBhk = req.getFamilySize() != null 
                    ? (req.getFamilySize() <= 2 ? 1 : req.getFamilySize() <= 4 ? 2 : 3) 
                    : 2;
                double derivedBudget = req.getIncome() != null ? req.getIncome() * 0.4 : 20000;
                
                List<String> amenityList = new ArrayList<>();
                if (req.getLifestyleNeeds() != null && !req.getLifestyleNeeds().isBlank()) {
                    amenityList = Arrays.asList(req.getLifestyleNeeds().split("[,\\s]+"))
                        .stream().filter(s -> s.length() > 2).collect(Collectors.toList());
                }
                
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("city", req.getPreferredCity() != null ? req.getPreferredCity() : "");
                userMap.put("bhk", derivedBhk);
                userMap.put("budget", derivedBudget);
                userMap.put("property_type", "Apartment");
                userMap.put("amenities", amenityList);
                
                // Build properties list for Python (map entities to simple maps)
                List<Map<String, Object>> propMaps = candidates.stream().limit(50).map(p -> {
                    Map<String, Object> pm = new HashMap<>();
                    pm.put("id", p.getId());
                    pm.put("title", p.getTitle() != null ? p.getTitle() : "");
                    pm.put("city", p.getCity() != null ? p.getCity() : "");
                    pm.put("bhk", p.getBhk() != null ? p.getBhk() : 2);
                    pm.put("price", p.getPrice() != null ? p.getPrice() : 0);
                    pm.put("propertyType", p.getPropertyType() != null ? p.getPropertyType() : "");
                    // Amenities: stored as comma-separated string in entity
                    List<String> ams = p.getAmenities() != null 
                        ? Arrays.asList(p.getAmenities().split(",\\s*")) 
                        : new ArrayList<>();
                    pm.put("amenities", ams);
                    return pm;
                }).collect(Collectors.toList());
                
                Map<String, Object> pyPayload = new HashMap<>();
                pyPayload.put("user", userMap);
                pyPayload.put("properties", propMaps);
                
                List<Map<String, Object>> pyResults = pythonAiClient.recommend(pyPayload);
                
                if (pyResults != null && !pyResults.isEmpty()) {
                    // Map Python results back to AiRecommendResponse DTOs
                    // Python returns: [{id, title, matchScore, reasoning}]
                    // We need to enrich with full property data and generate reasoning
                    List<AiRecommendResponse> enriched = pyResults.stream()
                        .map(r -> {
                            Long propId = ((Number) r.get("id")).longValue();
                            double pyScore = ((Number) r.get("matchScore")).doubleValue();
                            String pyReasoning = (String) r.get("reasoning");
                            
                            return candidates.stream()
                                .filter(p -> p.getId().equals(propId))
                                .findFirst()
                                .map(p -> {
                                    double normScore = Math.max(40.0, Math.min(99.0, pyScore));
                                    // Use existing fallback reasoning if Python reasoning is generic
                                    String finalReasoning = (pyReasoning != null && !pyReasoning.isBlank()) 
                                        ? pyReasoning 
                                        : fallbackService.recommendReasoning(p, req, normScore);
                                    
                                    ScoredProperty sp = calculateScoredProperty(p, req, null);
                                    return new AiRecommendResponse(
                                        PropertyDTO.from(p),
                                        Math.round(normScore * 10.0) / 10.0,
                                        finalReasoning,
                                        sp.budgetFit(),
                                        sp.familySizeFit(),
                                        sp.cityMatch(),
                                        sp.trustScoreContrib(),
                                        sp.lifestyleMatch(),
                                        sp.budgetMatch(),
                                        sp.lifestyleMatchScore(),
                                        sp.commuteMatch(),
                                        sp.familyMatch(),
                                        sp.trustMatch(),
                                        sp.verificationMatch()
                                    );
                                }).orElse(null);
                        })
                        .filter(r -> r != null)
                        .collect(Collectors.toList());
                    
                    if (!enriched.isEmpty()) return enriched;
                }
            } catch (Exception e) {
                log.warn("Python recommendation failed, using Java fallback: {}", e.getMessage());
            }
        }

        // Fall through to existing Java scoring (keep existing code exactly as-is below this block)
        float[] queryVec = null;
        try {
            queryVec = embeddingService.generateEmbedding(req.getLifestyleNeeds() != null
                    ? req.getLifestyleNeeds() : "");
        } catch (Exception ignored) {}

        final float[] finalVec = queryVec;
        List<ScoredProperty> scored = candidates.stream()
                .map(p -> calculateScoredProperty(p, req, finalVec))
                .sorted(Comparator.comparingDouble(ScoredProperty::score).reversed())
                .limit(10)
                .collect(Collectors.toList());

        return scored.stream()
                .map(sp -> {
                    double normScore = Math.max(40.0, Math.min(99.0, sp.score()));
                    String reasoning = fallbackService.recommendReasoning(sp.property(), req, normScore);

                    return new AiRecommendResponse(
                            PropertyDTO.from(sp.property()),
                            Math.round(normScore * 10.0) / 10.0,
                            reasoning,
                            sp.budgetFit(),
                            sp.familySizeFit(),
                            sp.cityMatch(),
                            sp.trustScoreContrib(),
                            sp.lifestyleMatch(),
                            sp.budgetMatch(),
                            sp.lifestyleMatchScore(),
                            sp.commuteMatch(),
                            sp.familyMatch(),
                            sp.trustMatch(),
                            sp.verificationMatch()
                    );
                })
                .collect(Collectors.toList());
    }

    @Async
    public void generateAndStoreTrustExplanation(Long propertyId) {
        try {
            Property property = propertyRepo.findById(propertyId).orElse(null);
            if (property == null) return;

            Map<String, Object> breakdown = trustService.getBreakdown(propertyId);
            int duplicateCount = embeddingService.countDuplicates(property);

            // Gemini completely disabled, directly route to fallback
            String explanation = fallbackService.explainTrust(breakdown, duplicateCount, property.getTitle());

            property.setAiExplanation(explanation);
            propertyRepo.save(property);
        } catch (Exception ignored) {
        }
    }

    public String getOrTriggerExplanation(Long propertyId) {
        Property property = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found: " + propertyId));

        if (property.getAiExplanation() != null && !property.getAiExplanation().isBlank()) {
            return property.getAiExplanation();
        }

        generateAndStoreTrustExplanation(propertyId);
        return "Trust explanation is being generated. Please refresh in a moment.";
    }

    public Map<String, Object> fairPrice(Long propertyId) {
        Property p = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found: " + propertyId));

        List<Property> similar = propertyRepo.findByCityAndBhkAndApprovedTrue(p.getCity(), p.getBhk());

        similar = similar.stream()
                .filter(s -> !s.getId().equals(p.getId()))
                .collect(Collectors.toList());

        if (similar.size() < 2) {
            return Map.of(
                    "listedPrice",    p.getPrice(),
                    "estimatedPrice", p.getPrice(),
                    "percentDiff",    0,
                    "verdict",        "Fairly Priced",
                    "color",          "#2d8653",
                    "sampleSize",     similar.size()
            );
        }

        double avg  = similar.stream().mapToDouble(Property::getPrice).average().orElse(p.getPrice());
        double diff = ((p.getPrice() - avg) / avg) * 100;

        String verdict, color;
        if      (diff < -10) { verdict = "Great Deal — " + (int) Math.abs(diff) + "% below market"; color = "#16a34a"; }
        else if (diff <  10) { verdict = "Fairly Priced";                                            color = "#2d8653"; }
        else if (diff <  20) { verdict = (int) diff + "% above market";                             color = "#b8952a"; }
        else                 { verdict = (int) diff + "% above market — negotiate";                 color = "#dc2626"; }

        Map<String, Object> result = new HashMap<>();
        result.put("listedPrice",    p.getPrice());
        result.put("estimatedPrice", Math.round(avg));
        result.put("percentDiff",    (int) diff);
        result.put("verdict",        verdict);
        result.put("color",          color);
        result.put("sampleSize",     similar.size());
        return result;
    }

    public Map<String, Object> trustBreakdown(Long propertyId) {
        return trustService.getBreakdown(propertyId);
    }

    public String generateDescription(PropertyDTO details) {
        return fallbackDescription(details);
    }

    public Map<String, Object> estimatePrice(PropertyDTO details) {
        String city = details.getCity();
        Integer bhk = details.getBedrooms() != null ? details.getBedrooms() : details.getBhk();
        Double area = details.getArea() != null ? details.getArea() : 1000.0;
        String listingType = details.getListingType() != null ? details.getListingType() : "RENT";
        String furnishing = details.getFurnishing();
        Double propertyAge = details.getPropertyAge() != null ? details.getPropertyAge() : 5.0;
        Integer bathrooms = details.getBathrooms() != null ? details.getBathrooms() : 2;

        double baseRate = getCityRate(city);
        double bhkNum = bhk != null ? bhk : 2;
        double areaNum = area != null ? area : 1000.0;

        // Try Python ML prediction first
        Map<String, Object> pythonPayload = new HashMap<>();
        pythonPayload.put("city", city != null ? city : "Chennai");
        pythonPayload.put("district", details.getLocation() != null ? details.getLocation() : "");
        pythonPayload.put("bhk", bhkNum);
        pythonPayload.put("area", areaNum);
        pythonPayload.put("furnished", furnishing != null ? furnishing : "Semi Furnished");
        pythonPayload.put("parking", true);
        pythonPayload.put("property_age", propertyAge);
        pythonPayload.put("bathrooms", bathrooms);

        Map<String, Object> pythonResult = pythonAiClient.predictPrice(pythonPayload);

        if (pythonResult != null && "success".equals(pythonResult.get("status"))) {
            double pythonRent = ((Number) pythonResult.get("predicted_rent")).doubleValue();
            String pythonEngine = (String) pythonResult.get("engine");

            // Apply sale multiplier if needed (Python returns rent estimate only)
            double finalEstimate = "SALE".equalsIgnoreCase(listingType) ? pythonRent * 12.0 * 80.0 : pythonRent;
            long min = Math.round(finalEstimate * 0.90);
            long max = Math.round(finalEstimate * 1.10);

            String explanation = fallbackService.estimatePriceExplanation(details, getCityRate(city), min, max);

            Map<String, Object> response = new HashMap<>();
            response.put("predictedRent", finalEstimate);
            response.put("estimatedMin", min);
            response.put("estimatedMax", max);
            response.put("confidenceScore", pythonResult.get("confidenceScore"));
            response.put("marketPosition", pythonResult.get("marketPosition"));
            response.put("demandLevel", pythonResult.get("demandLevel"));
            response.put("areaGrowth", pythonResult.get("areaGrowth"));
            response.put("factorsIncreasing", pythonResult.get("factorsIncreasing"));
            response.put("factorsReducing", pythonResult.get("factorsReducing"));
            response.put("comparableProperties", pythonResult.get("comparableProperties"));
            response.put("futureForecasts", pythonResult.get("futureForecasts"));
            response.put("explanation", explanation);
            response.put("city", city);
            response.put("listingType", listingType);
            response.put("source", "python-ml");
            response.put("engine", pythonEngine);

            // Keep breakdown structure
            Map<String, Object> breakdown = new HashMap<>();
            breakdown.put("baseRate", getCityRate(city));
            breakdown.put("baseEstimate", pythonRent);
            breakdown.put("bhkFactor", 0.8 + bhkNum * 0.1);
            breakdown.put("furnishingMultiplier", "Fully Furnished".equalsIgnoreCase(furnishing) ? 1.25 : ("Semi Furnished".equalsIgnoreCase(furnishing) ? 1.10 : 1.0));
            breakdown.put("saleMultiplier", "SALE".equalsIgnoreCase(listingType) ? 12.0 * 80.0 : 1.0);
            response.put("breakdown", breakdown);
            return response;
        }

        // Java Fallback
        double estimated = baseRate * areaNum * (0.8 + bhkNum * 0.1);
        if ("Fully Furnished".equalsIgnoreCase(furnishing)) {
            estimated *= 1.25;
        } else if ("Semi Furnished".equalsIgnoreCase(furnishing)) {
            estimated *= 1.10;
        }

        if ("SALE".equalsIgnoreCase(listingType)) {
            estimated = estimated * 12.0 * 80.0;
        }

        long min = Math.round(estimated * 0.90);
        long max = Math.round(estimated * 1.10);

        String explanation = fallbackService.estimatePriceExplanation(details, baseRate, min, max);

        Map<String, Object> response = new HashMap<>();
        response.put("predictedRent", estimated);
        response.put("estimatedMin", min);
        response.put("estimatedMax", max);
        response.put("confidenceScore", 85);
        response.put("marketPosition", "Fairly Priced");
        response.put("demandLevel", "High");
        response.put("areaGrowth", 7.2);

        // Factors Increasing
        List<Map<String, Object>> inc = new ArrayList<>();
        inc.add(Map.of("factor", "Carpet Area Size", "impact", "+85%", "reason", "Area space matching details"));
        if ("Fully Furnished".equalsIgnoreCase(furnishing)) {
            inc.add(Map.of("factor", "Furnishing Premium", "impact", "+25%", "reason", "Fully furnished convenient setup"));
        }
        response.put("factorsIncreasing", inc);
        response.put("factorsReducing", new ArrayList<>());

        // Comparable Properties
        List<Map<String, Object>> compList = new ArrayList<>();
        try {
            List<Property> all = propertyRepo.findAll();
            List<Property> sameCity = all.stream()
                .filter(p -> p.getCity() != null && p.getCity().equalsIgnoreCase(city))
                .limit(3)
                .collect(Collectors.toList());
            for (Property cp : sameCity) {
                double diff = (cp.getPrice() != null ? cp.getPrice() : 0.0) - estimated;
                compList.add(Map.of(
                    "title", cp.getBhk() + " BHK in " + cp.getCity(),
                    "rent", cp.getPrice() != null ? cp.getPrice() : 0.0,
                    "difference", diff >= 0 ? "+₹" + Math.round(diff) : "-₹" + Math.round(Math.abs(diff)),
                    "similarity", 92.5
                ));
            }
        } catch (Exception ignored) {}
        if (compList.isEmpty()) {
            compList.add(Map.of("title", bhkNum + " BHK Standard Unit", "rent", Math.round(estimated * 0.98), "difference", "-₹" + Math.round(estimated * 0.02), "similarity", 95.0));
            compList.add(Map.of("title", bhkNum + " BHK Premium Unit", "rent", Math.round(estimated * 1.05), "difference", "+₹" + Math.round(estimated * 0.05), "similarity", 90.0));
        }
        response.put("comparableProperties", compList);

        // Future Forecasts
        List<Map<String, Object>> forecasts = List.of(
            Map.of("months", 3, "rent", Math.round(estimated * 1.018), "change", "+1.8%"),
            Map.of("months", 6, "rent", Math.round(estimated * 1.036), "change", "+3.6%"),
            Map.of("months", 12, "rent", Math.round(estimated * 1.072), "change", "+7.2%")
        );
        response.put("futureForecasts", forecasts);

        response.put("explanation", explanation);
        response.put("city", city);
        response.put("listingType", listingType);
        response.put("source", "java-fallback");
        response.put("engine", "Rule-based Math Model");

        Map<String, Object> breakdown = new HashMap<>();
        breakdown.put("baseRate", baseRate);
        breakdown.put("areaContribution", baseRate * areaNum);
        breakdown.put("bhkFactor", 0.8 + bhkNum * 0.1);
        breakdown.put("furnishingMultiplier", "Fully Furnished".equalsIgnoreCase(furnishing) ? 1.25 : ("Semi Furnished".equalsIgnoreCase(furnishing) ? 1.10 : 1.0));
        breakdown.put("saleMultiplier", "SALE".equalsIgnoreCase(listingType) ? 12.0 * 80.0 : 1.0);
        breakdown.put("baseEstimate", baseRate * areaNum * (0.8 + bhkNum * 0.1));
        response.put("breakdown", breakdown);

        return response;
    }

    /**
     * Contextual Market Analysis for Price Trends page.
     */
    public Map<String, Object> getMarketAnalysis(String city) {
        double baseRate = getCityRate(city);
        double saleAvg = baseRate * 1000.0 * 12.0 * 80.0 / 1000.0; // sale price per sqft
        double rentAvg = baseRate; // rent per sqft per month

        String app = "6.8%";
        String liquidity = "Moderate";
        String demand = "Stable";
        if ("Chennai".equalsIgnoreCase(city)) {
            app = "8.4%"; liquidity = "High"; demand = "High";
        } else if ("Coimbatore".equalsIgnoreCase(city)) {
            app = "7.2%"; liquidity = "High"; demand = "Moderate";
        }

        double finalSaleAvg = saleAvg;
        double finalRentAvg = rentAvg;
        List<Property> active = propertyRepo.findByCityAndApprovedTrue(city).stream()
                .filter(p -> !"SOLD".equalsIgnoreCase(p.getStatus()) && !"RENTED".equalsIgnoreCase(p.getStatus()))
                .toList();

        if (!active.isEmpty()) {
            double saleSum = 0; int saleCnt = 0;
            double rentSum = 0; int rentCnt = 0;
            for (Property p : active) {
                double area = p.getArea() != null && p.getArea() > 0 ? p.getArea() : 1000.0;
                if ("SALE".equalsIgnoreCase(p.getListingType())) {
                    saleSum += (p.getPrice() / area);
                    saleCnt++;
                } else {
                    rentSum += (p.getPrice() / area);
                    rentCnt++;
                }
            }
            if (saleCnt > 0) saleAvg = saleSum / saleCnt;
            if (rentCnt > 0) rentAvg = rentSum / rentCnt;
        }

        double diffSalePercent = ((saleAvg - finalSaleAvg) / finalSaleAvg) * 100;
        double diffRentPercent = ((rentAvg - finalRentAvg) / finalRentAvg) * 100;

        String buyerRec = "Fair pricing detected. Focus on negotiating details and target high trust score properties.";
        String sellerRec = "Stable market value. Highlight property amenities and complete listing detail fields for faster closing.";
        String investmentOutlook = "Stable rental yields play. Accumulate assets in high appreciation corridors.";

        if (diffSalePercent > 10) {
            buyerRec = "Asking rates are premium. Look for motivated sellers or properties with active RERA verification tags.";
            sellerRec = "Premium market phase. Capitalize on elevated pricing indices. List details completely now.";
            investmentOutlook = "Consolidate. Yields are compressed. Focus strictly on premium commercial plots.";
        } else if (diffSalePercent < -10) {
            buyerRec = "Attractive valuation. Current listings are undervalued. Strong buy signal for long-term appreciation.";
            sellerRec = "Hold assets. Market price is depressed. Defer selling until baseline demand levels return.";
            investmentOutlook = "Highly Bullish. Undervalued catalog provides a strong margin of safety.";
        }

        // Gemini completely disabled, directly route to fallback
        String aiAnalysis = String.format(
            "The real estate market in %s exhibits a %s demand profile with a solid %.1f%% annual capital appreciation rate. " +
            "Average sale prices stand at ₹%,.0f/sqft and rentals at ₹%,.0f/sqft/mo, showing high investment potential.",
            city, demand, Double.parseDouble(app.replace("%","")), saleAvg, rentAvg
        );

        Map<String, Object> res = new HashMap<>();
        res.put("city", city);
        res.put("avgSalePriceSqft", Math.round(saleAvg));
        res.put("avgRentPriceSqft", Math.round(rentAvg));
        res.put("appreciationRate", app);
        res.put("liquidityScore", liquidity);
        res.put("demandQuotient", demand);
        res.put("diffSalePercent", Math.round(diffSalePercent));
        res.put("diffRentPercent", Math.round(diffRentPercent));
        res.put("buyerRecommendation", buyerRec);
        res.put("sellerRecommendation", sellerRec);
        res.put("investmentOutlook", investmentOutlook);
        res.put("aiMarketAnalysis", aiAnalysis);
        return res;
    }

    private double getCityRate(String city) {
        if (city == null) return 12.0;
        switch (city) {
            case "Chennai": return 22.0;
            case "Coimbatore": return 15.0;
            case "Madurai": return 12.0;
            case "Tiruchirappalli": return 11.0;
            case "Salem": return 10.0;
            case "Tiruppur": return 10.5;
            case "Vellore": return 9.5;
            default: return 12.0;
        }
    }

    private String fallbackDescription(PropertyDTO details) {
        Integer bhk = details.getBedrooms() != null ? details.getBedrooms() : details.getBhk();
        String bhkStr = bhk != null ? bhk.toString() : "2";
        String type = details.getPropertyType() != null ? details.getPropertyType() : "Apartment";
        String area = details.getArea() != null ? details.getArea().toString() : "1000";
        String listing = details.getListingType() != null ? details.getListingType().toLowerCase() : "rent";
        String city = details.getCity() != null ? details.getCity() : "Tamil Nadu";
        String location = details.getLocation() != null ? details.getLocation() : city;
        String furnishing = details.getFurnishing();
        String furnStr = (furnishing != null && !furnishing.isBlank()) ? " " + furnishing + "." : "";

        return String.format(
            "Presenting a premium %s BHK %s located in the prime area of %s, %s. Spanning a built-up area of %s sqft, this %s property offers excellent utility. Currently available for %s, contact the agent for quick site visits.",
            bhkStr, type, location, city, area, furnStr, listing
        );
    }

    private String callGeminiDirect(String prompt) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + geminiKey;
        
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of(
            "role", "user",
            "parts", List.of(textPart)
        );
        
        Map<String, Object> genConfig = Map.of("maxOutputTokens", 200, "temperature", 0.7);
        
        Map<String, Object> bodyMap = new HashMap<>();
        bodyMap.put("contents", List.of(content));
        bodyMap.put("generationConfig", genConfig);

        String jsonBody = objectMapper.writeValueAsString(bodyMap);
        
        RequestBody body = RequestBody.create(jsonBody, MediaType.parse("application/json"));
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .build();
                
        try (Response response = httpClient.newCall(request).execute()) {
            if (response.isSuccessful() && response.body() != null) {
                String responseBody = response.body().string();
                JsonNode root = objectMapper.readTree(responseBody);
                return root.path("candidates").get(0)
                        .path("content").path("parts").get(0)
                        .path("text").asText().trim();
            }
        }
        return null;
    }

    private ScoredProperty calculateScoredProperty(Property p, AiRecommendRequest req, float[] queryVec) {
        // 1. Budget Match (30%)
        double budgetMatch = 70.0;
        if (req.getIncome() != null && p.getPrice() != null) {
            double income = req.getIncome();
            double maxBudget = income * 0.4;
            double price = p.getPrice();
            if (price > maxBudget) {
                budgetMatch = Math.max(10.0, 50.0 * (maxBudget / price) - 10.0);
            } else {
                double ratio = price / maxBudget;
                if (ratio >= 0.5 && ratio <= 1.0) {
                    budgetMatch = 85.0 + 15.0 * (1.0 - (ratio - 0.5) / 0.5);
                } else {
                    budgetMatch = Math.max(40.0, 85.0 * (ratio / 0.5));
                }
            }
        }
        
        // 2. Lifestyle Match (25%)
        double lifestyleMatchScore = 65.0;
        if (req.getLifestyleNeeds() != null && !req.getLifestyleNeeds().isBlank()) {
            String needs = req.getLifestyleNeeds().toLowerCase();
            String body = ((p.getTitle() != null ? p.getTitle() : "") + " " +
                           (p.getDescription() != null ? p.getDescription() : "") + " " +
                           (p.getAmenities() != null ? p.getAmenities() : "")).toLowerCase();
            String[] keywords = needs.split("[,\\s]+");
            int hits = 0;
            int validKwCount = 0;
            for (String kw : keywords) {
                if (kw.length() > 2) {
                    validKwCount++;
                    if (body.contains(kw)) {
                        hits++;
                    }
                }
            }
            if (validKwCount > 0) {
                lifestyleMatchScore = 40.0 + 60.0 * ((double) hits / validKwCount);
            }
        } else if (queryVec != null && queryVec.length > 0) {
            float[] propVec = embeddingService.getStoredEmbedding(p.getId());
            if (propVec != null) {
                double similarity = embeddingService.cosineSimilarity(queryVec, propVec);
                lifestyleMatchScore = Math.max(20.0, Math.min(100.0, similarity * 100.0));
            }
        }

        // 3. Commute Match (15%)
        double commuteMatch = 75.0;
        if (req.getWorkplaceArea() != null && !req.getWorkplaceArea().isBlank()) {
            String work = req.getWorkplaceArea().toLowerCase();
            String loc = (p.getLocation() != null ? p.getLocation() : "").toLowerCase();
            String landmark = (p.getNearbyLandmarks() != null ? p.getNearbyLandmarks() : "").toLowerCase();
            if (loc.contains(work)) {
                commuteMatch = 100.0;
            } else if (landmark.contains(work)) {
                commuteMatch = 90.0;
            } else if (req.getPreferredCity() != null && p.getCity() != null && p.getCity().equalsIgnoreCase(req.getPreferredCity())) {
                commuteMatch = 70.0;
            } else {
                commuteMatch = 40.0;
            }
        }

        // 4. Family Match (15%)
        double familyMatch = 70.0;
        if (req.getFamilySize() != null && p.getBhk() != null) {
            int idealBhk = req.getFamilySize() <= 2 ? 1 : req.getFamilySize() <= 4 ? 2 : 3;
            int diff = Math.abs(p.getBhk() - idealBhk);
            double baseFamily = Math.max(30.0, 95.0 - diff * 30.0);
            double bonus = 0.0;
            if (req.getFamilySize() >= 4) {
                String amenities = (p.getAmenities() != null ? p.getAmenities() : "").toLowerCase();
                if (amenities.contains("security")) bonus += 5.0;
                if (amenities.contains("parking")) bonus += 5.0;
            }
            familyMatch = Math.min(100.0, baseFamily + bonus);
        }

        // 5. Trust Match (10%)
        double trustMatch = p.getTrustScore() != null ? p.getTrustScore() : 70.0;

        // 6. Verification Match (5%)
        double verificationMatch = (Boolean.TRUE.equals(p.getAgentVerified()) || (p.getAgent() != null && "VERIFIED".equals(p.getAgent().getKycStatus()))) ? 100.0 : 50.0;

        // Final weighted score = 30% Budget + 25% Lifestyle + 15% Commute + 15% Family + 10% Trust + 5% Verification
        double finalScore = 0.30 * budgetMatch +
                            0.25 * lifestyleMatchScore +
                            0.15 * commuteMatch +
                            0.15 * familyMatch +
                            0.10 * trustMatch +
                            0.05 * verificationMatch;

        // Map legacy fits for compatibility:
        double budgetFit = budgetMatch * 0.25;
        double familySizeFit = familyMatch * 0.20;
        double cityMatch = commuteMatch * 0.15;
        double trustScoreContrib = trustMatch * 0.20;
        double lifestyleMatch = lifestyleMatchScore * 0.20;

        return new ScoredProperty(p, finalScore, budgetFit, familySizeFit, cityMatch, trustScoreContrib, lifestyleMatch,
                                  budgetMatch, lifestyleMatchScore, commuteMatch, familyMatch, trustMatch, verificationMatch);
    }

    private record ScoredProperty(
        Property property,
        double score,
        double budgetFit,
        double familySizeFit,
        double cityMatch,
        double trustScoreContrib,
        double lifestyleMatch,
        double budgetMatch,
        double lifestyleMatchScore,
        double commuteMatch,
        double familyMatch,
        double trustMatch,
        double verificationMatch
    ) {}
}
