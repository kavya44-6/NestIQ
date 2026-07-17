package com.example.project.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AiChatRequest {
    private Long              propertyId;
    private String            message;
    /** Conversation history: list of { role: "user"|"model", parts: [{ text: "..." }] } */
    private List<Map<String, Object>> history;
}
