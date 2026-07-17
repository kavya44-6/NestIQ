package com.example.project.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.project.dto.InquiryDTO;
import com.example.project.dto.OwnerMessageDTO;
import com.example.project.dto.PropertyDTO;
import com.example.project.dto.VisitDTO;
import com.example.project.entity.OwnerMessage;
import com.example.project.entity.User;
import com.example.project.repository.InquiryRepository;
import com.example.project.repository.OwnerMessageRepository;
import com.example.project.repository.PropertyRepository;
import com.example.project.repository.UserRepository;
import com.example.project.repository.VisitRepository;

@Service
public class OwnerService {

    private final UserRepository         userRepo;
    private final PropertyRepository     propertyRepo;
    private final InquiryRepository      inquiryRepo;
    private final VisitRepository        visitRepo;
    private final OwnerMessageRepository messageRepo;
    private final PropertyService        propertyService;
    private final EmailService           emailService;

    public OwnerService(UserRepository userRepo,
                        PropertyRepository propertyRepo,
                        InquiryRepository inquiryRepo,
                        VisitRepository visitRepo,
                        OwnerMessageRepository messageRepo,
                        PropertyService propertyService,
                        EmailService emailService) {
        this.userRepo        = userRepo;
        this.propertyRepo    = propertyRepo;
        this.inquiryRepo     = inquiryRepo;
        this.visitRepo       = visitRepo;
        this.messageRepo     = messageRepo;
        this.propertyService = propertyService;
        this.emailService    = emailService;
    }

    public Map<String, Object> getDashboardStats() {
        User owner = getCurrentUser();
        return getDashboardStats(owner.getEmail());
    }

    public Map<String, Object> getDashboardStats(String email) {
        User owner = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        long totalProperties  = propertyRepo.findByOwnerId(owner.getId()).size();
        long totalInquiries   = inquiryRepo.countByPropertyOwnerId(owner.getId());
        long totalVisits      = visitRepo.countByPropertyOwnerId(owner.getId());
        long pendingMessages  = messageRepo.countPendingByOwnerId(owner.getId());

        Map<String, Object> map = new HashMap<>();
        map.put("totalProperties", totalProperties);
        map.put("totalInquiries",  totalInquiries);
        map.put("totalVisits",     totalVisits);
        map.put("pendingMessages", pendingMessages);
        return map;
    }

    public List<PropertyDTO> getMyProperties(String email) {
        User owner = getUser(email);
        return propertyRepo.findByOwnerId(owner.getId())
                .stream().map(PropertyDTO::from).collect(Collectors.toList());
    }

    public PropertyDTO addProperty(PropertyDTO dto) {
        User owner = getCurrentUser();
        PropertyDTO saved = propertyService.addOwnerProperty(dto, owner);
        
        emailService.sendPropertyListedToOwner(
            owner.getEmail(), owner.getName(),
            saved.getTitle(), saved.getCity(),
            saved.getAgentRequestStatus());
            
        return saved;
    }

    public List<InquiryDTO> getMyInquiries(String email) {
        User owner = getUser(email);
        return inquiryRepo.findByPropertyOwnerId(owner.getId())
                .stream().map(InquiryDTO::from).collect(Collectors.toList());
    }

    public List<VisitDTO> getMyVisits(String email) {
        User owner = getUser(email);
        return visitRepo.findByPropertyOwnerId(owner.getId())
                .stream().map(VisitDTO::from).collect(Collectors.toList());
    }

    public List<OwnerMessageDTO> getMessages(String email) {
        User owner = getUser(email);
        return messageRepo.findByPropertyOwnerId(owner.getId())
                .stream().map(OwnerMessageDTO::from).collect(Collectors.toList());
    }

    public OwnerMessageDTO replyToMessage(String email, Long messageId, String reply) {
        User owner = getUser(email);
        OwnerMessage msg = messageRepo.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!msg.getProperty().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Not authorised");
        }

        msg.setOwnerReply(reply);
        msg.setStatus("REPLIED");
        msg.setRepliedAt(LocalDateTime.now());
        
        OwnerMessage saved = messageRepo.save(msg);
        
        emailService.sendOwnerReplyAlertToAgent(
            saved.getAgent().getEmail(),
            saved.getAgent().getName(),
            saved.getOwner().getName(),
            saved.getProperty().getTitle(),
            saved.getOwnerReply());

        return OwnerMessageDTO.from(saved);
    }

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
}
