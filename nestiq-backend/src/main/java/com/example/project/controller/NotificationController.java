package com.example.project.controller;

import com.example.project.dto.NotificationDTO;
import com.example.project.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import lombok.Data;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/stream/{userId}")
    public SseEmitter streamNotifications(@PathVariable Long userId) {
        return notificationService.createEmitter(userId);
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications() {
        return ResponseEntity.ok(notificationService.getNotificationsForUser());
    }

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody NotificationRequest req) {
        try {
            notificationService.sendNotification(
                    req.getUserId(),
                    req.getMessage(),
                    "GENERAL",
                    req.getLink() != null ? req.getLink() : ""
            );
            return ResponseEntity.ok("Created");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            notificationService.markRead(id);
            return ResponseEntity.ok("Marked read");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        try {
            notificationService.markAllRead();
            return ResponseEntity.ok("All marked read");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    public static class NotificationRequest {
        private Long userId;
        private String message;
        private String link;
    }
}
