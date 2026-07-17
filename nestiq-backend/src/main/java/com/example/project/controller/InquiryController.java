package com.example.project.controller;

import com.example.project.dto.InquiryDTO;
import com.example.project.service.InquiryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {

    private final InquiryService inquiryService;

    public InquiryController(InquiryService inquiryService) {
        this.inquiryService = inquiryService;
    }

    // Customer: send inquiry
    @PostMapping
    public ResponseEntity<?> send(@RequestBody InquiryDTO req, Authentication auth) {
        try {
            return ResponseEntity.ok(inquiryService.send(auth.getName(), req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Customer: my inquiries
    @GetMapping("/my")
    public ResponseEntity<List<InquiryDTO>> getMyInquiries(Authentication auth) {
        return ResponseEntity.ok(inquiryService.getMyInquiries(auth.getName()));
    }

    // Agent: inquiries on my properties
    @GetMapping("/agent")
    public ResponseEntity<List<InquiryDTO>> getAgentInquiries(Authentication auth) {
        return ResponseEntity.ok(inquiryService.getAgentInquiries(auth.getName()));
    }

    // Agent: respond to an inquiry
    @PutMapping("/{id}/respond")
    public ResponseEntity<?> respond(@PathVariable Long id,
                                     @RequestBody Map<String, String> body,
                                     Authentication auth) {
        try {
            String message = body.get("message");
            return ResponseEntity.ok(inquiryService.respond(auth.getName(), id, message));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
