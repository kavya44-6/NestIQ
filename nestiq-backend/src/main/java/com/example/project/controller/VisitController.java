package com.example.project.controller;

import com.example.project.dto.VisitDTO;
import com.example.project.service.VisitService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/visits")
public class VisitController {

    private final VisitService visitService;

    public VisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    // Customer: book a visit
    @PostMapping
    public ResponseEntity<?> book(@RequestBody VisitDTO req, Authentication auth) {
        try {
            return ResponseEntity.ok(visitService.book(auth.getName(), req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Customer: my visits
    @GetMapping("/my")
    public ResponseEntity<List<VisitDTO>> getMyVisits(Authentication auth) {
        return ResponseEntity.ok(visitService.getMyVisits(auth.getName()));
    }

    // Agent: visits on my properties
    @GetMapping("/agent")
    public ResponseEntity<List<VisitDTO>> getAgentVisits(Authentication auth) {
        return ResponseEntity.ok(visitService.getAgentVisits(auth.getName()));
    }

    // Agent: mark visit COMPLETED or CANCELLED
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body,
                                          Authentication auth) {
        try {
            return ResponseEntity.ok(visitService.updateStatus(auth.getName(), id, body.get("status")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Customer: cancel their own visit
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id, Authentication auth) {
        try {
            return ResponseEntity.ok(visitService.cancel(auth.getName(), id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
