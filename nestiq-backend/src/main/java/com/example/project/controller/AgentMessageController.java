package com.example.project.controller;

import com.example.project.dto.OwnerMessageDTO;
import com.example.project.service.AgentMessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agent-messages")
public class AgentMessageController {

    private final AgentMessageService agentMessageService;

    public AgentMessageController(AgentMessageService agentMessageService) {
        this.agentMessageService = agentMessageService;
    }

    // Keep existing POST / (endpoint alias / fallback)
    @PostMapping
    public ResponseEntity<OwnerMessageDTO> sendMessage(@RequestBody Map<String, Object> body, Authentication auth) {
        Long propertyId = Long.valueOf(body.get("propertyId").toString());
        String message  = (String) body.get("message");
        return ResponseEntity.ok(agentMessageService.sendMessage(auth.getName(), propertyId, message));
    }

    // Keep existing GET /my
    @GetMapping("/my")
    public ResponseEntity<List<OwnerMessageDTO>> getMySentMessages(Authentication auth) {
        return ResponseEntity.ok(agentMessageService.getMySentMessages(auth.getName()));
    }

    // New Endpoint: POST /to-owner
    @PostMapping("/to-owner")
    public ResponseEntity<OwnerMessageDTO> sendToOwner(@RequestBody Map<String, Object> body) {
        Long propertyId = Long.valueOf(body.get("propertyId").toString());
        String message  = (String) body.get("message");
        return ResponseEntity.ok(agentMessageService.sendToOwner(propertyId, message));
    }

    // New Endpoint: GET /owner-replies
    @GetMapping("/owner-replies")
    public ResponseEntity<List<OwnerMessageDTO>> getOwnerReplies() {
        return ResponseEntity.ok(agentMessageService.getOwnerReplies());
    }
}
