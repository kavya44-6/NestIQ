package com.example.project.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.project.dto.PropertyDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Wraps the Gemini 1.5-flash REST API for property-scoped chat.
 * Moves the API call server-side so the key is never exposed in the
 * browser bundle. Falls back to a safe rule-based reply if the key
 * is missing or the API is unreachable.
 */
@Service
public class GeminiService {

    private static final String GEMINI_URL_TEMPLATE =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            // To this:
"gemini-2.0-flash:generateContent?key=%s";

    private static final String FALLBACK_REPLY =
            "I can only answer questions about this specific property. " +
            "For anything I can't answer here, please use the Inquiry form " +
            "to contact the agent directly.";

    @Value("${gemini.api.key:}")
    private String geminiKey;

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GeminiService() {
        this.httpClient   = new OkHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Chat constrained to the given property's fields.
     *
     * @param property  the property being asked about (used to build system context)
     * @param message   the user's latest message
     * @param history   prior conversation turns (may be null/empty)
     * @return          Gemini's reply, or fallback if unavailable
     */
    public String chat(PropertyDTO property, String message, List<Map<String, Object>> history) {
        if (geminiKey == null || geminiKey.isBlank()) return FALLBACK_REPLY;

        try {
            String url = String.format(GEMINI_URL_TEMPLATE, geminiKey);

            // Build contents array: system prompt + history + current message
            List<Map<String, Object>> contents = new ArrayList<>();

            // Inject property context as first user turn
            String systemContext = buildSystemContext(property);
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", systemContext))
            ));
            contents.add(Map.of(
                    "role", "model",
                    "parts", List.of(Map.of("text",
                            "Understood. I will only answer questions about this property " +
                            "and suggest the Inquiry form for anything outside my knowledge."))
            ));

            // Append prior history if provided
            if (history != null) {
                contents.addAll(history);
            }

            // Append current user message
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", message))
            ));

            Map<String, Object> body = new HashMap<>();
            body.put("contents", contents);

            String bodyJson = objectMapper.writeValueAsString(body);
            Request request = new Request.Builder()
                    .url(url)
                    .header("Content-Type", "application/json")
                    .post(RequestBody.create(bodyJson, MediaType.parse("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful() || response.body() == null) return FALLBACK_REPLY;
                JsonNode root = objectMapper.readTree(response.body().string());
                return root.path("candidates").get(0)
                           .path("content").path("parts").get(0)
                           .path("text").asText(FALLBACK_REPLY);
            }
        } catch (Exception e) {
            return FALLBACK_REPLY;
        }
    }

    /**
     * Generate property description using Gemini.
     */
    public String generateDescription(Map<String, Object> details) {
        if (geminiKey == null || geminiKey.isBlank()) return null;

        try {
            String title = (String) details.getOrDefault("title", "Residential Property");
            String city = (String) details.getOrDefault("city", "Tamil Nadu");
            String location = (String) details.getOrDefault("location", city);
            Object bhkVal = details.get("bhk");
            String bhk = bhkVal != null ? bhkVal.toString() : "2";
            Object areaVal = details.get("area");
            String area = areaVal != null ? areaVal.toString() + " sqft" : "not specified";
            String propertyType = (String) details.getOrDefault("propertyType", "Apartment");
            String listingType = "SALE".equals(details.get("listingType")) ? "For Sale" : "For Rent";
            String furnishing = (String) details.getOrDefault("furnishing", "Not specified");
            
            Object amenitiesObj = details.get("amenities");
            String amenities = "Standard amenities";
            if (amenitiesObj instanceof List<?>) {
                List<?> amList = (List<?>) amenitiesObj;
                if (!amList.isEmpty()) {
                    amenities = amList.stream().map(Object::toString).collect(Collectors.joining(", "));
                }
            }

            String prompt = String.format(
                    "Write a professional 3-sentence property description for a Tamil Nadu real estate listing.\n" +
                    "Use ONLY the provided details — do not invent any information.\n" +
                    "Tone: factual, professional, appealing to a genuine buyer or tenant.\n\n" +
                    "Property details:\n" +
                    "- Title: %s\n" +
                    "- City: %s\n" +
                    "- Location/Area: %s\n" +
                    "- BHK: %s\n" +
                    "- Area: %s\n" +
                    "- Property Type: %s\n" +
                    "- Listing Type: %s\n" +
                    "- Furnishing: %s\n" +
                    "- Amenities: %s\n\n" +
                    "Write exactly 3 sentences. No bullet points. No invented details.",
                    title, city, location, bhk, area, propertyType, listingType, furnishing, amenities
            );

            return callGeminiDirect(prompt);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Generate price explanation using Gemini.
     */
    public String generatePriceExplanation(String city, int bhk, double area, String listingType, double min, double max) {
        if (geminiKey == null || geminiKey.isBlank()) return null;

        try {
            String rentOrSale = "RENT".equalsIgnoreCase(listingType) ? " per month for rent" : " for sale";
            String prompt = String.format(
                    "Write exactly one sentence explaining why a %dBHK %.0f sqft property in %s, Tamil Nadu would be priced between " +
                    "₹%,.0f and ₹%,.0f%s. Be factual and specific to the Tamil Nadu real estate market. No made-up data.",
                    bhk, area, city, min, max, rentOrSale
            );

            return callGeminiDirect(prompt);
        } catch (Exception e) {
            return null;
        }
    }

    private String callGeminiDirect(String prompt) throws Exception {
        String url = String.format(GEMINI_URL_TEMPLATE, geminiKey);
        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", prompt))
        ));

        Map<String, Object> body = new HashMap<>();
        body.put("contents", contents);
        body.put("generationConfig", Map.of("maxOutputTokens", 200, "temperature", 0.7));

        String bodyJson = objectMapper.writeValueAsString(body);
        Request request = new Request.Builder()
                .url(url)
                .header("Content-Type", "application/json")
                .post(RequestBody.create(bodyJson, MediaType.parse("application/json")))
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) return null;
            JsonNode root = objectMapper.readTree(response.body().string());
            String text = root.path("candidates").get(0)
                       .path("content").path("parts").get(0)
                       .path("text").asText(null);
            return text != null ? text.trim() : null;
        }
    }

    private String buildSystemContext(PropertyDTO p) {
        return String.format(
                "You are a helpful assistant for a specific real estate listing. " +
                "Only answer questions about this property. " +
                "If asked about anything outside this property, suggest the Inquiry form.\n\n" +
                "Property details:\n" +
                "Title: %s\n" +
                "Price: ₹%s\n" +
                "Location: %s, %s\n" +
                "Type: %s | BHK: %s | Area: %s sq.ft\n" +
                "Listing: %s\n" +
                "Description: %s\n" +
                "Amenities: %s\n" +
                "Agent: %s (%s)",
                p.getTitle(),
                p.getPrice(),
                p.getLocation(), p.getCity(),
                p.getPropertyType(), p.getBhk(), p.getArea(),
                p.getListingType(),
                p.getDescription(),
                p.getAmenities(),
                p.getAgentName(), p.getAgentPhone()
        );
    }
}
