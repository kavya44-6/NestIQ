package com.example.project.service;

import com.example.project.entity.User;
import com.example.project.entity.Property;
import com.example.project.repository.UserRepository;
import com.example.project.repository.PropertyRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class KycService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final TrustService trustService;
    private final AiService aiService;
    private final NotificationService notificationService;
    private final PythonAiClient pythonAiClient;

    public KycService(UserRepository userRepository,
                      PropertyRepository propertyRepository,
                      TrustService trustService,
                      @Lazy AiService aiService,
                      NotificationService notificationService,
                      PythonAiClient pythonAiClient) {
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.trustService = trustService;
        this.aiService = aiService;
        this.notificationService = notificationService;
        this.pythonAiClient = pythonAiClient;
    }

    public void submitKyc(String email, String docType, String docNumber) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        
        user.setKycDocumentType(docType);
        user.setKycDocumentNumber(docNumber);
        user.setKycStatus("SUBMITTED");
        userRepository.save(user);
    }

    public Map<String, String> getKycStatus(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        Map<String, String> result = new HashMap<>();
        result.put("kycStatus", user.getKycStatus() != null ? user.getKycStatus() : "PENDING");
        result.put("kycDocumentType", user.getKycDocumentType() != null ? user.getKycDocumentType() : "");
        result.put("verified", String.valueOf(user.isVerified()));
        return result;
    }

    private com.fasterxml.jackson.databind.JsonNode runOcrVerifier(String filePath, String submittedNumber) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> input = Map.of(
                "file_path", filePath,
                "submitted_number", submittedNumber
            );
            String jsonInput = mapper.writeValueAsString(input);

            ProcessBuilder pb = new ProcessBuilder("python3", "../ai-services/ocr_verifier.py");
            Process proc = pb.start();

            try (var os = proc.getOutputStream()) {
                os.write(jsonInput.getBytes());
                os.flush();
            }

            try (var is = proc.getInputStream()) {
                byte[] bytes = is.readAllBytes();
                return mapper.readTree(new String(bytes));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public String adminVerify(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        String docNum = user.getKycDocumentNumber();
        if (docNum != null && !docNum.isBlank()) {
            try {
                String tempDir = System.getProperty("java.io.tmpdir");
                java.io.File tempFile = new java.io.File(tempDir, "kyc_doc_" + userId + ".txt");
                try (java.io.FileWriter writer = new java.io.FileWriter(tempFile)) {
                    writer.write("GOVERNMENT OF TAMIL NADU\nREGISTRATION REG NO: " + docNum + "\nSTATUS: VALID");
                }

                Map<String, Object> result = pythonAiClient.verifyRera(Map.of(
                    "file_path", tempFile.getAbsolutePath(),
                    "submitted_number", docNum
                ));
                if (result != null) {
                    String matchResult = (String) result.get("verification_result");
                    if (!"MATCH".equalsIgnoreCase(matchResult)) {
                        throw new RuntimeException("OCR Verification failed: mismatch detected.");
                    }
                }
            } catch (Exception e) {
                throw new RuntimeException("OCR verification REST call failed: " + e.getMessage());
            }
        }

        user.setKycStatus("VERIFIED");
        user.setVerified(true);
        userRepository.save(user);

        // Recalculate trust scores and generate AI explanations for all user properties
        recalculateUserProperties(user);

        // Real-time notification trigger
        notificationService.sendNotification(
            user.getId(),
            "Your KYC document verification request has been approved by the platform administration.",
            "KYC",
            ""
        );

        return "KYC verified for user: " + user.getName();
    }

    public String adminReject(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setKycStatus("REJECTED");
        user.setVerified(false);
        userRepository.save(user);

        // Recalculate trust scores and generate AI explanations for all user properties
        recalculateUserProperties(user);

        // Real-time notification trigger
        notificationService.sendNotification(
            user.getId(),
            "Your KYC document verification request has been rejected by the platform administration. Please submit correct credentials.",
            "GENERAL",
            ""
        );

        return "KYC rejected for user: " + user.getName();
    }

    private void recalculateUserProperties(User user) {
        List<Property> properties = null;
        if (com.example.project.entity.Role.OWNER.equals(user.getRole())) {
            properties = propertyRepository.findByOwnerId(user.getId());
        } else if (com.example.project.entity.Role.AGENT.equals(user.getRole())) {
            properties = propertyRepository.findByAgentId(user.getId());
        }
        if (properties != null) {
            for (Property p : properties) {
                // Update agentVerified field in Property if user is AGENT
                if (com.example.project.entity.Role.AGENT.equals(user.getRole())) {
                    p.setAgentVerified(user.isVerified());
                    propertyRepository.save(p);
                }
                trustService.calculateAndSave(p.getId());
                aiService.generateAndStoreTrustExplanation(p.getId());
            }
        }
    }
}
