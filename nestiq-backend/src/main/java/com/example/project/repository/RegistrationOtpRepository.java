package com.example.project.repository;

import com.example.project.entity.RegistrationOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RegistrationOtpRepository extends JpaRepository<RegistrationOtp, Long> {
    Optional<RegistrationOtp> findByEmail(String email);
}
