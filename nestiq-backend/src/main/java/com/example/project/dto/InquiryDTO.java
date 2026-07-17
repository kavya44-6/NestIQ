package com.example.project.dto;

import com.example.project.entity.Inquiry;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InquiryDTO {

    // Request fields
    private Long   propertyId;
    private String message;

    // For agent respond endpoint
    private String agentResponse;

    // Response fields
    private Long          id;
    private String        propertyTitle;
    private Long          customerId;
    private String        customerName;    // <-- this is the field the frontend displays
    private String        customerEmail;
    private String        status;
    private LocalDateTime createdAt;

    private String        agentRequestStatus;

    public static InquiryDTO from(Inquiry i) {
        InquiryDTO d = new InquiryDTO();
        d.setId(i.getId());
        d.setPropertyId(i.getProperty().getId());
        d.setPropertyTitle(i.getProperty().getTitle());
        d.setMessage(i.getMessage());
        d.setAgentResponse(i.getAgentResponse());
        d.setStatus(i.getStatus());
        d.setCreatedAt(i.getCreatedAt());

        // Explicitly read from the customer association — not from the
        // currently-authenticated principal. With FetchType.EAGER on
        // Inquiry.customer this is always the correct customer User object.
        d.setCustomerId(i.getCustomer().getId());
        d.setCustomerName(i.getCustomer().getName());
        d.setCustomerEmail(i.getCustomer().getEmail());
        
        if (i.getProperty() != null) {
            d.setAgentRequestStatus(i.getProperty().getAgentRequestStatus());
        }
        return d;
    }
}
