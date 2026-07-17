package com.example.project.service;

import com.example.project.dto.AuthResponse;
import com.example.project.dto.LoginRequest;
import com.example.project.dto.RegisterRequest;
import com.example.project.entity.RegistrationOtp;
import com.example.project.entity.Role;
import com.example.project.entity.User;
import com.example.project.repository.RegistrationOtpRepository;
import com.example.project.repository.UserRepository;
import com.example.project.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository             userRepo;
    private final RegistrationOtpRepository  registrationOtpRepo;
    private final PasswordEncoder            encoder;
    private final JwtUtil                    jwtUtil;
    private final EmailService               emailService;

    public AuthService(UserRepository userRepo,
                       RegistrationOtpRepository registrationOtpRepo,
                       PasswordEncoder encoder,
                       JwtUtil jwtUtil,
                       EmailService emailService) {
        this.userRepo            = userRepo;
        this.registrationOtpRepo = registrationOtpRepo;
        this.encoder             = encoder;
        this.jwtUtil             = jwtUtil;
        this.emailService        = emailService;
    }

    public String register(RegisterRequest req) {
        if (req.getEmail() == null) {
            throw new RuntimeException("Email is required.");
        }
        String cleanEmail = req.getEmail().trim().toLowerCase();

        if (userRepo.findByEmail(cleanEmail).isPresent()) {
            throw new RuntimeException("This email is already registered.");
        }

        // Validate password length
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters.");
        }

        // Check if registration OTP already exists to check the 30 seconds rate-limit
        RegistrationOtp existing = registrationOtpRepo.findByEmail(cleanEmail).orElse(null);
        if (existing != null && existing.getLastSentTime() != null) {
            if (existing.getLastSentTime().plusSeconds(30).isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Please wait 30 seconds before requesting another OTP.");
            }
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));

        // Save or update RegistrationOtp
        if (existing == null) {
            existing = new RegistrationOtp();
        }
        existing.setEmail(cleanEmail);
        existing.setName(req.getName());
        // Encrypt password using BCrypt exactly as current auth uses
        existing.setPassword(encoder.encode(req.getPassword()));
        existing.setRole(req.getRole() != null ? req.getRole().toUpperCase() : "CUSTOMER");
        existing.setPhone(req.getPhone());
        existing.setOtp(otp);
        existing.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        existing.setLastSentTime(LocalDateTime.now());

        registrationOtpRepo.save(existing);

        // Send OTP
        try {
            emailService.sendRegistrationOtp(cleanEmail, otp);
        } catch (Exception e) {
            log.warn("SMTP failure, registering with dev fallback: {}", e.getMessage());
        }

        return "OTP sent to email. Please verify. (DEV-MODE OTP: " + otp + ")";
    }

    public String resendOtp(String email) {
        if (email == null) {
            throw new RuntimeException("Email is required.");
        }
        String cleanEmail = email.trim().toLowerCase();

        if (userRepo.findByEmail(cleanEmail).isPresent()) {
            throw new RuntimeException("This email is already registered.");
        }

        RegistrationOtp record = registrationOtpRepo.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("No registration in progress for this email."));

        if (record.getLastSentTime() != null) {
            if (record.getLastSentTime().plusSeconds(30).isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Please wait 30 seconds before requesting another OTP.");
            }
        }

        String otp = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
        record.setOtp(otp);
        record.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        record.setLastSentTime(LocalDateTime.now());

        registrationOtpRepo.save(record);

        try {
            emailService.sendRegistrationOtp(cleanEmail, otp);
        } catch (Exception e) {
            log.warn("SMTP failure, resending with dev fallback: {}", e.getMessage());
        }

        return "Verification code resent successfully. (DEV-MODE OTP: " + otp + ")";
    }

    public String verifyRegistrationOtp(String email, String otp) {
        if (email == null) {
            throw new RuntimeException("Email is required.");
        }
        String cleanEmail = email.trim().toLowerCase();

        RegistrationOtp record = registrationOtpRepo.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("No registration in progress for this email."));

        if (record.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired. Please request another OTP.");
        }

        if (!record.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        // Only AFTER successful verification: Create the User record in the database
        String roleStr = record.getRole() != null ? record.getRole().toUpperCase() : "CUSTOMER";
        User user = User.builder()
                .name(record.getName())
                .email(record.getEmail())
                .password(record.getPassword()) // password was already BCrypt encoded
                .role(Role.valueOf(roleStr))
                .phone(record.getPhone())
                .verified(true)
                .build();

        userRepo.save(user);

        // Delete registration OTP record to prevent reuse
        registrationOtpRepo.delete(record);

        // Optionally generate the same JWT flow, but the request expects returning: "Registration Successful"
        return "Registration Successful";
    }

    public AuthResponse login(LoginRequest req) {
        if (req.getEmail() == null) {
            throw new RuntimeException("Email is required.");
        }
        String cleanEmail = req.getEmail().trim().toLowerCase();

        User user = userRepo.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials.");
        }
        String token = jwtUtil.generateToken(user.getEmail(),
                                             user.getRole().name());
        return new AuthResponse(token, user.getRole().name(),
                                user.getId(), user.getName());
    }
}
