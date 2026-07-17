package com.example.project.service;

import com.example.project.dto.VisitDTO;
import com.example.project.entity.Property;
import com.example.project.entity.User;
import com.example.project.entity.Visit;
import com.example.project.repository.PropertyRepository;
import com.example.project.repository.UserRepository;
import com.example.project.repository.VisitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VisitService {

    private final VisitRepository    visitRepo;
    private final PropertyRepository propertyRepo;
    private final UserRepository     userRepo;
    private final EmailService       emailService;
    private final NotificationService notificationService;

    public VisitService(VisitRepository visitRepo,
                        PropertyRepository propertyRepo,
                        UserRepository userRepo,
                        EmailService emailService,
                        NotificationService notificationService) {
        this.visitRepo    = visitRepo;
        this.propertyRepo = propertyRepo;
        this.userRepo     = userRepo;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    public VisitDTO book(String customerEmail, VisitDTO req) {
        User     customer = getUser(customerEmail);
        Property property = getProperty(req.getPropertyId());

        LocalDate visitDate = LocalDate.parse(req.getVisitDate());
        if (visitDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("Visit date cannot be in the past.");
        }

        Visit visit = Visit.builder()
                .customer(customer)
                .property(property)
                .visitDate(visitDate)
                .timeSlot(req.getTimeSlot())
                .build();

        Visit saved = visitRepo.save(visit);

        if (property.getAgent() != null) {
            emailService.sendVisitConfirmationToCustomer(
                customer.getEmail(), customer.getName(),
                property.getTitle(), property.getCity(),
                visit.getVisitDate().toString(), visit.getTimeSlot(),
                property.getAgentName(), property.getAgentPhone());
            emailService.sendVisitAlertToAgent(
                property.getAgent().getEmail(),
                property.getAgentName(),
                customer.getName(), property.getTitle(),
                visit.getVisitDate().toString(), visit.getTimeSlot());

            notificationService.sendNotification(
                property.getAgent().getId(),
                "📅 New Site Visit request from " + customer.getName() + " for property " + property.getTitle(),
                "VISIT",
                "/agent/visits"
            );
        } else if (property.getOwner() != null) {
            emailService.sendVisitConfirmationToCustomer(
                customer.getEmail(), customer.getName(),
                property.getTitle(), property.getCity(),
                visit.getVisitDate().toString(), visit.getTimeSlot(),
                property.getOwner().getName(), 
                property.getOwner().getPhone());
            emailService.sendVisitAlertToOwner(
                property.getOwner().getEmail(),
                property.getOwner().getName(),
                customer.getName(), property.getTitle(),
                visit.getVisitDate().toString(), visit.getTimeSlot());

            notificationService.sendNotification(
                property.getOwner().getId(),
                "📅 New Site Visit request from " + customer.getName() + " for property " + property.getTitle(),
                "VISIT",
                "/owner/inquiries"
            );
        }

        return VisitDTO.from(saved);
    }

    public List<VisitDTO> getMyVisits(String customerEmail) {
        User customer = getUser(customerEmail);
        return visitRepo.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream().map(VisitDTO::from).collect(Collectors.toList());
    }

    public List<VisitDTO> getAgentVisits(String agentEmail) {
        User agent = getUser(agentEmail);
        return visitRepo.findByPropertyAgentId(agent.getId())
                .stream().map(VisitDTO::from).collect(Collectors.toList());
    }

    public VisitDTO updateStatus(String email, Long visitId, String status) {
        Visit visit = visitRepo.findById(visitId)
                .orElseThrow(() -> new RuntimeException("Visit not found"));
        Property prop = visit.getProperty();
        boolean isAgent = prop.getAgent() != null && prop.getAgent().getEmail().equals(email);
        boolean isOwner = prop.getOwner() != null && prop.getOwner().getEmail().equals(email);
        if (!isAgent && !isOwner) {
            throw new RuntimeException("Not authorised");
        }
        visit.setStatus(status);
        Visit saved = visitRepo.save(visit);

        if ("APPROVED".equalsIgnoreCase(status)) {
            Property propToUpdate = visit.getProperty();
            if ("AVAILABLE".equals(propToUpdate.getStatus())) {
                propToUpdate.setStatus("VISIT_SCHEDULED");
                propertyRepo.save(propToUpdate);
            }
        }

        emailService.sendVisitStatusToCustomer(
            visit.getCustomer().getEmail(),
            visit.getCustomer().getName(),
            visit.getProperty().getTitle(),
            status,
            visit.getVisitDate().toString());

        notificationService.sendNotification(
            visit.getCustomer().getId(),
            "📅 Your site visit request for " + prop.getTitle() + " has been " + status.toLowerCase(),
            "VISIT",
            "/customer/visits"
        );

        return VisitDTO.from(saved);
    }

    public VisitDTO cancel(String customerEmail, Long visitId) {
        Visit visit = visitRepo.findById(visitId)
                .orElseThrow(() -> new RuntimeException("Visit not found"));
        if (!visit.getCustomer().getEmail().equals(customerEmail)) {
            throw new RuntimeException("Not authorised");
        }
        visit.setStatus("CANCELLED");
        Visit saved = visitRepo.save(visit);

        emailService.sendVisitStatusToCustomer(
            visit.getCustomer().getEmail(),
            visit.getCustomer().getName(),
            visit.getProperty().getTitle(),
            "CANCELLED",
            visit.getVisitDate().toString());
        
        if ("ASSIGNED".equals(visit.getProperty().getAgentRequestStatus())) {
            emailService.sendVisitCancelledToAgent(
                visit.getProperty().getAgent().getEmail(),
                visit.getProperty().getAgentName(),
                visit.getCustomer().getName(),
                visit.getProperty().getTitle(),
                visit.getVisitDate().toString());
        }

        return VisitDTO.from(saved);
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
