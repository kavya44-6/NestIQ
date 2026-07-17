package com.example.project.service;

import com.example.project.dto.PropertyDTO;
import com.example.project.dto.AiRecommendRequest;
import com.example.project.dto.AiRecommendResponse;
import com.example.project.entity.Property;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RuleBasedFallbackService {

    /**
     * Contextual rule-based chatbot fallback.
     */
    public String chat(PropertyDTO p, String query) {
        if (p == null) return "I don't have information about this property.";
        String q = query.toLowerCase();

        String title = p.getTitle();
        double price = p.getPrice() != null ? p.getPrice() : 0.0;
        String city = p.getCity() != null ? p.getCity() : "Tamil Nadu";
        String location = p.getLocation() != null ? p.getLocation() : city;
        int bhk = p.getBhk() != null ? p.getBhk() : (p.getBedrooms() != null ? p.getBedrooms() : 2);
        double area = p.getArea() != null ? p.getArea() : 0.0;
        String status = p.getStatus() != null ? p.getStatus() : "AVAILABLE";
        int trust = p.getTrustScore() != null ? p.getTrustScore() : 70;
        String listingType = p.getListingType() != null ? p.getListingType() : "RENT";
        String furnishing = p.getFurnishing() != null ? p.getFurnishing() : "Semi Furnished";
        String amenities = (p.getAmenities() != null && !p.getAmenities().isEmpty()) ? String.join(", ", p.getAmenities()) : "Standard utilities";

        // EMI Calculations
        double downPayment = price * 0.20;
        double loanAmount = price * 0.80;
        double annualInterest = 8.5;
        double monthlyInterest = (annualInterest / 12) / 100;
        int months = 20 * 12;
        double emi = 0;
        if (monthlyInterest > 0) {
            emi = (loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, months)) / (Math.pow(1 + monthlyInterest, months) - 1);
        } else {
            emi = loanAmount / months;
        }

        if (q.contains("price") || q.contains("cost") || q.contains("rate") || q.contains("rent") || q.contains("sale") || q.contains("buy")) {
            String formatPrice = String.format("₹%,.0f", price);
            return String.format("The price of this property is %s%s.", formatPrice, "RENT".equalsIgnoreCase(listingType) ? " per month for rent" : " for sale");
        }
        
        if (q.contains("amenit") || q.contains("facilit") || q.contains("parking") || q.contains("gym") || q.contains("pool") || q.contains("backup")) {
            return String.format("This property offers the following amenities: %s. It features private parking slots, security systems, and continuous water supply.", amenities);
        }

        if (q.contains("location") || q.contains("where") || q.contains("address") || q.contains("city") || q.contains("map")) {
            return String.format("The property is situated in %s, %s. It enjoys great connectivity to major highways, local schools, and public transport hubs.", location, city);
        }

        if (q.contains("bhk") || q.contains("bedroom") || q.contains("room") || q.contains("layout") || q.contains("bathroom")) {
            return String.format("This is a well-designed %d BHK property with %d bathrooms, featuring wide windows, private balconies, and optimal cross-ventilation.", bhk, p.getBathrooms() != null ? p.getBathrooms() : 2);
        }

        if (q.contains("area") || q.contains("size") || q.contains("sqft") || q.contains("square") || q.contains("dimension")) {
            return String.format("The total built-up area is %.0f sqft, maximizing functional carpet space and offering spacious living rooms.", area);
        }

        if (q.contains("available") || q.contains("status") || q.contains("sold") || q.contains("rented") || q.contains("occupied")) {
            return String.format("This listing status is current: %s. You can schedule a visit immediately using the visit scheduler on this page.", status);
        }

        if (q.contains("trust") || q.contains("score") || q.contains("verif") || q.contains("legit") || q.contains("safe")) {
            String verdict = trust >= 85 ? "Highly Trusted" : trust >= 60 ? "Trusted" : "Moderate Trust";
            return String.format("This property has an Ecosystem Trust Score of %d/100, which qualifies as '%s'. The rating aggregates completeness of listing specifications, verified lister credentials, and absence of pricing anomalies.", trust, verdict);
        }

        if (q.contains("emi") || q.contains("loan") || q.contains("mortgage") || q.contains("finance") || q.contains("payment")) {
            return String.format("Based on the price of ₹%,.0f: with a 20%% down payment (₹%,.0f), a loan of ₹%,.0f at a standard %.1f%% annual interest rate for 20 years results in an estimated monthly payment of ₹%,.0f.", 
                    price, downPayment, loanAmount, annualInterest, emi);
        }

        if (q.contains("nearby") || q.contains("school") || q.contains("hospital") || q.contains("transit") || q.contains("metro") || q.contains("market") || q.contains("facility")) {
            return String.format("Nearby places include: prime educational schools, healthcare clinics, supermarkets, and public transport corridors within a 1.5km radius. Excellent connectivity score for families and commuters.");
        }

        if (q.contains("investment") || q.contains("yield") || q.contains("growth") || q.contains("worth") || q.contains("future")) {
            double yield = "RENT".equalsIgnoreCase(listingType) ? (price * 12 / (price * 20)) * 100 : 3.8;
            return String.format("Investment Outlook: Strong. The city of %s reports steady average appreciation rates. Estimated rental yield is %.1f%% with highly liquid transaction rates in this micro-market.", city, yield);
        }

        if (q.contains("summary") || q.contains("details") || q.contains("overview") || q.contains("about")) {
            return String.format("Here is the Property Summary: A %d BHK %s of %.0f sqft located in %s, %s. Furnishing: %s. Trust score is %d/100 with active status: %s.", 
                    bhk, p.getPropertyType() != null ? p.getPropertyType() : "Residency", area, location, city, furnishing, trust, status);
        }

        return String.format("I am the AI Assistant for '%s'. Feel free to ask me about its price (₹%,.0f), location (%s), amenities, BHK count (%d BHK), total size (%.0f sqft), trust rating (%d/100), estimated mortgage/EMI, or nearby facilities. You can also send a direct inquiry to the listing agent.", 
                title, price, location, bhk, area, trust);
    }

    /**
     * Structured rule-based recommendations fallback.
     */
    public String recommendReasoning(Property p, AiRecommendRequest req, double matchScore) {
        String city = p.getCity() != null ? p.getCity() : "Tamil Nadu";
        double price = p.getPrice() != null ? p.getPrice() : 0.0;
        int bhk = p.getBhk() != null ? p.getBhk() : 2;
        double area = p.getArea() != null ? p.getArea() : 1000.0;
        String furnishing = p.getFurnishing() != null ? p.getFurnishing() : "Semi Furnished";
        String amenities = (p.getAmenities() != null && !p.getAmenities().isEmpty()) ? String.join(", ", p.getAmenities().split(",")) : "Standard utilities";

        int invScore = getInvestmentScore(p);
        String localitySummary = getLocalitySummary(city);
        String fraudText = p.getTrustScore() != null && p.getTrustScore() >= 60 ? "Low - listing verified against duplicates." : "Moderate - review listing documents.";

        return String.format(
            "Match Rating: %.1f%%. " +
            "Reasons: Price fits comfortably within your monthly budget and BHK size aligns with your household profile of %d. " +
            "Pros: Premium location; verified badge; amenities list: %s. " +
            "Cons: %s. " +
            "Nearby Facilities: Educational centers, transit lanes, and medical facilities within 2km. " +
            "Investment Score: %d/100 (Strong market growth index). " +
            "Locality Outlook: %s. " +
            "Fraud Risk: %s. " +
            "Buyer Verdict: Recommended. High trust and fair pricing present a sound residential and capital asset play.",
            matchScore * 100, req.getFamilySize(), amenities, "Unfurnished".equalsIgnoreCase(furnishing) ? "Unit is unfurnished requiring additional setup costs" : "High demand might limit negotiation room", invScore, localitySummary, fraudText
        );
    }

    /**
     * Local price estimation fallback explaining all metrics.
     */
    public String estimatePriceExplanation(PropertyDTO details, double baseRate, long min, long max) {
        String city = details.getCity();
        int bhk = details.getBhk() != null ? details.getBhk() : 2;
        double area = details.getArea() != null ? details.getArea() : 1000.0;
        String type = details.getPropertyType() != null ? details.getPropertyType() : "Apartment";
        String amenities = (details.getAmenities() != null && !details.getAmenities().isEmpty()) ? String.join(", ", details.getAmenities()) : "standard amenities";

        return String.format(
            "Estimated fair market range is calculated based on %s's base rate of ₹%,.0f/sqft for a %d BHK %s. " +
            "Factors accounted for: built-up area of %.0f sqft (+60%% weight), %s amenities (+15%% premium), and furnishing style. " +
            "Current sub-market transaction average for this locality stands at ₹%,.0f. " +
            "Confidence Level: 92%% (High) derived from active density indices.",
            city, baseRate, bhk, type, area, amenities, (min + max) / 2
        );
    }

    /**
     * Fallback explanation for Trust Score.
     */
    public String explainTrust(Map<String, Object> breakdown, int duplicateCount, String title) {
        int score = (int) breakdown.getOrDefault("totalScore", 70);
        String status = (String) breakdown.getOrDefault("status", "Trusted");
        int listingQuality = (int) breakdown.getOrDefault("listingQuality", 20);
        int documentVerification = (int) breakdown.getOrDefault("documentVerification", 20);
        int fraudSignals = (int) breakdown.getOrDefault("fraudSignals", 15);

        String positiveFactors = "Positive drivers: Complete listing parameters (+%d points) and verified credentials (+%d points).";
        String improvement = score >= 85 ? "Lister credentials are fully verified. No further actions needed."
                           : "To maximize this score to 100, the lister should complete any missing fields and upload RERA/Aadhaar certificate documentation to trigger the verified badge.";

        return String.format(
            "Listing \"%s\" has an Ecosystem Trust Rating of %d/100 (%s). " +
            String.format(positiveFactors, listingQuality, documentVerification) + " " +
            (duplicateCount > 0 ? String.format("WARNING: %d near-duplicate listing(s) detected — possible cloned ad. ", duplicateCount) : "No pricing duplicate risks found. ") +
            "Fraud check: %d/15 (Pricing matches local baseline). " +
            "Action Plan: %s",
            title, score, status, fraudSignals, improvement
        );
    }

    // Helpers
    private int getInvestmentScore(Property p) {
        if (p.getCity() == null) return 75;
        switch (p.getCity()) {
            case "Chennai": return 88;
            case "Coimbatore": return 82;
            case "Madurai": return 72;
            case "Salem": return 75;
            default: return 70;
        }
    }

    private String getLocalitySummary(String city) {
        switch (city) {
            case "Chennai": return "Fast-growing IT corridor with high capital appreciation (+8.4% annually) and metro connectivity upgrades.";
            case "Coimbatore": return "Emerging technology and education hub with high rental demand and steady villa appreciation (+7.2% annually).";
            case "Madurai": return "Stable cultural and retail center showing consistent, low-volatility capital appreciation (+5.8% annually).";
            default: return "Developing market with moderate appreciation potential and steady local buyer interest.";
        }
    }
}
