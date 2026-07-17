package com.example.project.dto;

import com.example.project.entity.OwnerMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerMessageDTO {

    // Request fields
    private Long   propertyId;
    private String message;
    private String agentMessage;
    private String reply;

    // Response fields
    private Long          id;
    private String        propertyTitle;
    private Long          agentId;
    private String        agentName;
    private Long          ownerId;
    private String        ownerName;
    private String        status;
    private String        ownerReply;
    private LocalDateTime repliedAt;
    private LocalDateTime createdAt;

    public static OwnerMessageDTO from(OwnerMessage m) {
        if (m == null) return null;
        OwnerMessageDTO d = new OwnerMessageDTO();
        d.setId(m.getId());
        d.setPropertyId(m.getProperty() != null ? m.getProperty().getId() : null);
        d.setPropertyTitle(m.getProperty() != null ? m.getProperty().getTitle() : null);
        d.setAgentId(m.getAgent() != null ? m.getAgent().getId() : null);
        d.setAgentName(m.getAgent() != null ? m.getAgent().getName() : null);
        d.setOwnerId(m.getOwner() != null ? m.getOwner().getId() : null);
        d.setOwnerName(m.getOwner() != null ? m.getOwner().getName() : null);
        d.setMessage(m.getAgentMessage());
        d.setAgentMessage(m.getAgentMessage());
        d.setStatus(m.getStatus());
        d.setOwnerReply(m.getOwnerReply());
        d.setRepliedAt(m.getRepliedAt());
        d.setCreatedAt(m.getCreatedAt());
        return d;
    }
}
