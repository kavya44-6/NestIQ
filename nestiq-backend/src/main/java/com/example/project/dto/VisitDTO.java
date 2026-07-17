package com.example.project.dto;

import com.example.project.entity.Visit;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class VisitDTO {

    // Request fields
    private Long   propertyId;
    private String visitDate;   // "YYYY-MM-DD"
    private String timeSlot;

    // For status update
    private String status;

    // Response fields
    private Long          id;
    private String        propertyTitle;
    private Long          customerId;
    private String        customerName;    // <-- displayed on agent's visit page
    private String        customerEmail;
    private String        agentNote;
    private LocalDateTime createdAt;

    public static VisitDTO from(Visit v) {
        VisitDTO d = new VisitDTO();
        d.setId(v.getId());
        d.setPropertyId(v.getProperty().getId());
        d.setPropertyTitle(v.getProperty().getTitle());
        d.setVisitDate(v.getVisitDate() != null ? v.getVisitDate().toString() : null);
        d.setTimeSlot(v.getTimeSlot());
        d.setStatus(v.getStatus());
        d.setAgentNote(v.getAgentNote());
        d.setCreatedAt(v.getCreatedAt());

        // Same fix as InquiryDTO — read from the EAGER-loaded customer
        // association, not from the request context.
        d.setCustomerId(v.getCustomer().getId());
        d.setCustomerName(v.getCustomer().getName());
        d.setCustomerEmail(v.getCustomer().getEmail());
        return d;
    }
}
