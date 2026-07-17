package com.example.project.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.project.dto.OwnerMessageDTO;
import com.example.project.entity.OwnerMessage;
import com.example.project.entity.Property;
import com.example.project.entity.User;
import com.example.project.repository.OwnerMessageRepository;
import com.example.project.repository.PropertyRepository;
import com.example.project.repository.UserRepository;

@Service
public class AgentMessageService {

    private final OwnerMessageRepository ownerMessageRepository;
    private final PropertyRepository     propertyRepository;
    private final UserRepository         userRepository;
    private final EmailService           emailService;

    public AgentMessageService(OwnerMessageRepository ownerMessageRepository,
                               PropertyRepository propertyRepository,
                               UserRepository userRepository,
                               EmailService emailService) {
        this.ownerMessageRepository  = ownerMessageRepository;
        this.propertyRepository = propertyRepository;
        this.userRepository     = userRepository;
        this.emailService       = emailService;
    }

    public OwnerMessageDTO sendToOwner(String agentEmail, Long propertyId, String message) {
        User agent = getUser(agentEmail);
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found: " + propertyId));

        User owner = property.getOwner() != null ? property.getOwner() : property.getAgent();

        OwnerMessage msg = OwnerMessage.builder()
                .agentMessage(message)
                .agent(agent)
                .owner(owner)
                .property(property)
                .build();

        OwnerMessage saved = ownerMessageRepository.save(msg);

        // Notify owner using new template method
        if (saved.getOwner() != null && saved.getOwner().getEmail() != null) {
            emailService.sendOwnerMessageAlertToOwner(
                saved.getOwner().getEmail(),
                saved.getOwner().getName(),
                saved.getAgent().getName(),
                saved.getProperty().getTitle(),
                saved.getAgentMessage());
        }

        return toOwnerDTO(saved);
    }

    public List<OwnerMessageDTO> getOwnerReplies(String agentEmail) {
        User agent = getUser(agentEmail);
        return ownerMessageRepository.findByAgentIdOrderByCreatedAtDesc(agent.getId())
                .stream()
                .filter(m -> m.getOwnerReply() != null)
                .map(this::toOwnerDTO)
                .collect(Collectors.toList());
    }

    public List<OwnerMessageDTO> getMySentMessages(String agentEmail) {
        User agent = getUser(agentEmail);
        return ownerMessageRepository.findByAgentIdOrderByCreatedAtDesc(agent.getId())
                .stream().map(this::toOwnerDTO).collect(Collectors.toList());
    }

    public OwnerMessageDTO sendToOwner(Long propertyId, String message) {
        User agent = getCurrentUser();
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found: " + propertyId));
        User owner = property.getOwner() != null ? property.getOwner() : property.getAgent();
        OwnerMessage msg = OwnerMessage.builder()
                .agentMessage(message)
                .agent(agent)
                .owner(owner)
                .property(property)
                .build();
        
        OwnerMessage saved = ownerMessageRepository.save(msg);

        // Notify owner using new template method
        if (saved.getOwner() != null && saved.getOwner().getEmail() != null) {
            emailService.sendOwnerMessageAlertToOwner(
                saved.getOwner().getEmail(),
                saved.getOwner().getName(),
                saved.getAgent().getName(),
                saved.getProperty().getTitle(),
                saved.getAgentMessage());
        }

        return toOwnerDTO(saved);
    }

    public List<OwnerMessageDTO> getOwnerReplies() {
        User agent = getCurrentUser();
        return ownerMessageRepository.findByAgent(agent)
                .stream().map(this::toOwnerDTO).collect(Collectors.toList());
    }

    // Aliases / Legacy Support
    public OwnerMessageDTO sendMessage(String agentEmail, Long propertyId, String message) {
        return sendToOwner(agentEmail, propertyId, message);
    }

    public OwnerMessageDTO sendMessage(Long propertyId, String message) {
        return sendToOwner(propertyId, message);
    }

    public List<OwnerMessageDTO> getMyMessages(String agentEmail) {
        return getMySentMessages(agentEmail);
    }

    public List<OwnerMessageDTO> getMyMessages() {
        User agent = getCurrentUser();
        return getMySentMessages(agent.getEmail());
    }

    private OwnerMessageDTO toOwnerDTO(OwnerMessage m) {
        if (m == null) return null;
        return OwnerMessageDTO.builder()
                .id(m.getId())
                .agentMessage(m.getAgentMessage())
                .ownerReply(m.getOwnerReply())
                .status(m.getStatus())
                .createdAt(m.getCreatedAt())
                .repliedAt(m.getRepliedAt())
                .agentId(m.getAgent() != null ? m.getAgent().getId() : null)
                .agentName(m.getAgent() != null ? m.getAgent().getName() : null)
                .ownerId(m.getOwner() != null ? m.getOwner().getId() : null)
                .ownerName(m.getOwner() != null ? m.getOwner().getName() : null)
                .propertyId(m.getProperty() != null ? m.getProperty().getId() : null)
                .propertyTitle(m.getProperty() != null ? m.getProperty().getTitle() : null)
                .build();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User is not authenticated");
        }
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
