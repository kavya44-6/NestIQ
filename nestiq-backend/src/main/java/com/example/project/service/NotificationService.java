package com.example.project.service;

import com.example.project.dto.NotificationDTO;
import com.example.project.entity.Notification;
import com.example.project.entity.User;
import com.example.project.repository.NotificationRepository;
import com.example.project.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;
    private final ConcurrentHashMap<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public NotificationService(NotificationRepository notificationRepo, UserRepository userRepo) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
    }

    public SseEmitter createEmitter(Long userId) {
        // Emitter with a 10 minutes timeout
        SseEmitter emitter = new SseEmitter(600_000L);

        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError((e) -> emitters.remove(userId));

        // Initial handshake event
        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connection established"));
        } catch (Exception e) {
            emitters.remove(userId);
        }

        return emitter;
    }

    public void sendNotification(Long userId, String message, String type, String link) {
        Notification notif = Notification.builder()
                .recipientId(userId)
                .message(message)
                .type(type)
                .link(link)
                .read(false)
                .build();

        Notification saved = notificationRepo.save(notif);

        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name("NOTIFICATION").data(NotificationDTO.from(saved)));
            } catch (Exception e) {
                emitters.remove(userId);
            }
        }
    }

    public List<NotificationDTO> getNotificationsForUser() {
        User user = getCurrentUser();
        return notificationRepo.findByRecipientIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(NotificationDTO::from)
                .collect(Collectors.toList());
    }

    public void markRead(Long notifId) {
        Notification n = notificationRepo.findById(notifId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setRead(true);
        notificationRepo.save(n);
    }

    public void markAllRead() {
        User user = getCurrentUser();
        List<Notification> all = notificationRepo.findByRecipientIdOrderByCreatedAtDesc(user.getId());
        for (Notification n : all) {
            n.setRead(true);
        }
        notificationRepo.saveAll(all);
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
