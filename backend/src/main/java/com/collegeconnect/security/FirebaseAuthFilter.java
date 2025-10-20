package com.collegeconnect.security;

import com.google.firebase.auth.FirebaseToken;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class FirebaseAuthFilter extends OncePerRequestFilter {

    private final FirebaseTokenVerifier tokenVerifier;
    private final CurrentUser currentUser;

    public FirebaseAuthFilter(FirebaseTokenVerifier tokenVerifier, CurrentUser currentUser) {
        this.tokenVerifier = tokenVerifier;
        this.currentUser = currentUser;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // Allow public access to health endpoint and static assets
        if (path.equals("/health") || path.equals("/healthz") || path.equals("/")) return true;
        // Allow unauthenticated upsert of user profiles from the client during simulated login.
        // The frontend performs a PUT to /api/users/{uid} immediately after anonymous sign-in
        // and may not yet have a valid ID token. Skip the filter for that specific case.
        if (path.startsWith("/api/users") && "PUT".equalsIgnoreCase(request.getMethod())) return true;

        return !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        try {
            FirebaseToken token = tokenVerifier.verify(authHeader);
            if (token == null) {
                response.sendError(HttpStatus.UNAUTHORIZED.value(), "Missing or invalid token");
                return;
            }
            // attach uid for downstream use in bean
            currentUser.setUid(token.getUid());
            request.setAttribute("firebaseUid", token.getUid());
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid token: " + e.getMessage());
        }
    }
}
