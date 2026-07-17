package com.example.project.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AiRecommendResponse {
    private PropertyDTO property;
    private double      matchScore;
    private String      reasoning;
    
    // Legacy breakdown metrics (kept for compatibility)
    private double      budgetFit;
    private double      familySizeFit;
    private double      cityMatch;
    private double      trustScoreContrib;
    private double      lifestyleMatch;

    // Redesigned 0-100 scale metrics
    private double      budgetMatch;
    private double      lifestyleMatchScore;
    private double      commuteMatch;
    private double      familyMatch;
    private double      trustMatch;
    private double      verificationMatch;

    public AiRecommendResponse(PropertyDTO property, double matchScore, String reasoning,
                               double budgetFit, double familySizeFit, double cityMatch,
                               double trustScoreContrib, double lifestyleMatch,
                               double budgetMatch, double lifestyleMatchScore, double commuteMatch,
                               double familyMatch, double trustMatch, double verificationMatch) {
        this.property = property;
        this.matchScore = matchScore;
        this.reasoning = reasoning;
        this.budgetFit = budgetFit;
        this.familySizeFit = familySizeFit;
        this.cityMatch = cityMatch;
        this.trustScoreContrib = trustScoreContrib;
        this.lifestyleMatch = lifestyleMatch;
        this.budgetMatch = budgetMatch;
        this.lifestyleMatchScore = lifestyleMatchScore;
        this.commuteMatch = commuteMatch;
        this.familyMatch = familyMatch;
        this.trustMatch = trustMatch;
        this.verificationMatch = verificationMatch;
    }
}
