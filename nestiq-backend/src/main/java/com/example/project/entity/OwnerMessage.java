package com.example.project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "owner_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agent_id")
    private User agent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "agent_message", columnDefinition = "TEXT")
    private String agentMessage;

    @Column(name = "owner_reply", columnDefinition = "TEXT")
    private String ownerReply;

    @Builder.Default
    @Column(nullable = false)
    private String status = "PENDING";   // PENDING | REPLIED

    private LocalDateTime repliedAt;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status    == null) status    = "PENDING";
    }
}
