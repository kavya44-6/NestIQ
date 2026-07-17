package com.example.project.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow CORS preflight for ALL paths
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Auth endpoints — MUST be public
                .requestMatchers("/api/auth/**").permitAll()
                // Public property browsing
                .requestMatchers(HttpMethod.GET, "/api/properties/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/properties/public/**").permitAll()
                // Owner-only endpoints
                .requestMatchers("/api/owner/**").hasRole("OWNER")
                // Agent-only properties endpoints
                .requestMatchers("/api/properties/**").hasRole("AGENT")
                // Public property reviews
                .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                // AI authenticated endpoints
                .requestMatchers(HttpMethod.POST, "/api/ai/predict-price").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/ai/recommend").authenticated()
                // AI and trust endpoints — public for property detail page
                .requestMatchers("/api/ai/**").permitAll()
                .requestMatchers("/api/trust/**").permitAll()
                // SSE notifications stream
                .requestMatchers("/api/notifications/stream/**").permitAll()
                // Admin endpoints — ADMIN role required (translates to ROLE_ADMIN authority)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Everything else requires valid JWT
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter,
                UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "http://127.0.0.1:5176"
        ));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of(
            "GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}