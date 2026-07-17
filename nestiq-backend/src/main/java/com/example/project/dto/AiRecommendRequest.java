package com.example.project.dto;

import lombok.Data;

@Data
public class AiRecommendRequest {
    private Double income;
    private Integer familySize;
    private String  preferredCity;
    private String  workplaceArea;
    private String  lifestyleNeeds;
}
