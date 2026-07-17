package com.example.project.service;

import com.example.project.dto.InquiryDTO;
import com.example.project.entity.Inquiry;
import com.example.project.entity.Property;
import com.example.project.entity.User;
import com.example.project.repository.InquiryRepository;
import com.example.project.repository.PropertyRepository;
import com.example.project.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InquiryService {

    private final InquiryRepository  inquiryRepo;
    private final PropertyRepository propertyRepo;
    private final UserRepository     userRepo;
    private final EmailService       emailService;
    private final NotificationService notificationService;

    public InquiryService(InquiryRepository inquiryRepo,
                          PropertyRepository propertyRepo,
                          UserRepository userRepo,
                          EmailService emailService,
                          NotificationService notificationService) {
        this.inquiryRepo  = inquiryRepo;
        this.propertyRepo = propertyRepo;
        this.userRepo     = userRepo;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    public InquiryDTO send(String customerEmail, InquiryDTO req) {
        User     customer = getUser(customerEmail);
        Property property = getProperty(req.getPropertyId());

        Inquiry inquiry = Inquiry.builder()
                .customer(customer)
                .property(property)
                .message(req.getMessage())
                .build();

        Inquiry saved = inquiryRepo.save(inquiry);

        if (property.getAgent() != null) {
            emailService.sendInquiryConfirmationToCustomer(
                customer.getEmail(), customer.getName(),
                property.getTitle(), property.getCity(),
                property.getAgentName(), inquiry.getMessage());
            emailService.sendInquiryAlertToAgent(
                property.getAgent().getEmail(),
                property.getAgentName(),
                customer.getName(), property.getTitle(),
                property.getCity(), inquiry.getMessage());

            notificationService.sendNotification(
                property.getAgent().getId(),
                "💬 New Inquiry from " + customer.getName() + " for property " + property.getTitle(),
                "INQUIRY",
                "/agent/inquiries"
            );
        } else if (property.getOwner() != null) {
            emailService.sendInquiryConfirmationToCustomer(
                customer.getEmail(), customer.getName(),
                property.getTitle(), property.getCity(),
                property.getOwner().getName(), inquiry.getMessage());
            emailService.sendInquiryAlertToOwner(
                property.getOwner().getEmail(), 
                property.getOwner().getName(),
                customer.getName(), property.getTitle(),
                property.getCity(), inquiry.getMessage());

            notificationService.sendNotification(
                property.getOwner().getId(),
                "💬 New Inquiry from " + customer.getName() + " for property " + property.getTitle(),
                "INQUIRY",
                "/owner/inquiries"
            );
        }

        return InquiryDTO.from(saved);
    }

    public List<InquiryDTO> getMyInquiries(String customerEmail) {
        User customer = getUser(customerEmail);
        return inquiryRepo.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream().map(InquiryDTO::from).collect(Collectors.toList());
    }

    public List<InquiryDTO> getAgentInquiries(String agentEmail) {
        User agent = getUser(agentEmail);
        return inquiryRepo.findByPropertyAgentId(agent.getId())
                .stream().map(InquiryDTO::from).collect(Collectors.toList());
    }

    public InquiryDTO respond(String email, Long inquiryId, String message) {
        Inquiry inq = inquiryRepo.findById(inquiryId)
                .orElseThrow(() -> new RuntimeException("Inquiry not found"));

        Property prop = inq.getProperty();
        boolean isAgent = prop.getAgent() != null && prop.getAgent().getEmail().equals(email);
        boolean isOwner = prop.getOwner() != null && prop.getOwner().getEmail().equals(email);
        if (!isAgent && !isOwner) {
            throw new RuntimeException("Not authorised — only the assigned agent or property owner can respond");
        }

        inq.setAgentResponse(message);
        inq.setStatus("RESPONDED");
        
        Inquiry responded = inquiryRepo.save(inq);

        String replierName = isAgent ? prop.getAgentName() : prop.getOwner().getName();
        emailService.sendInquiryReplyToCustomer(
            inq.getCustomer().getEmail(),
            inq.getCustomer().getName(),
            prop.getTitle(),
            replierName,
            message);

        notificationService.sendNotification(
            inq.getCustomer().getId(),
            "💬 Response to your inquiry on " + prop.getTitle() + " from " + replierName,
            "INQUIRY",
            "/customer/inquiries"
        );

        return InquiryDTO.from(responded);
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private Property getProperty(Long id) {
        return propertyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found: " + id));
    }
}
