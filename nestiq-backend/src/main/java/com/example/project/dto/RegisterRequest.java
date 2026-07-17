package com.example.project.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String role;   // "AGENT" | "CUSTOMER" | "ADMIN"
    private String phone;
}
