package com.example.project.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest  request,
                                    HttpServletResponse response,
                                    FilterChain         chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip token parsing for public paths
        if (path.startsWith("/api/auth/")
                || path.startsWith("/api/properties/public")
                || path.startsWith("/api/ai/")
                || path.startsWith("/api/trust/")) {
            chain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        String token  = null;
        String email  = null;

        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
            try { email = jwtUtil.extractEmail(token); }
            catch (Exception ignored) {}
        }

        if (email != null
                && jwtUtil.validateToken(token)
                && SecurityContextHolder.getContext()
                                        .getAuthentication() == null) {
            String role = jwtUtil.extractRole(token);
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    email, null,
                    Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + role))
                );
            auth.setDetails(new WebAuthenticationDetailsSource()
                                .buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        chain.doFilter(request, response);
    }
}