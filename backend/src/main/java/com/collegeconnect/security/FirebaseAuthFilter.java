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
        // In local development (when Firestore emulator is used), allow all /api/* requests
        // to pass through without auth to simplify flows. The emulator env var is set by our
        // start scripts. Do NOT use this in production environments.
        if (System.getenv("FIRESTORE_EMULATOR_HOST") != null && path.startsWith("/api/")) {
            return true;
        }
        // Allow public access to health endpoint and static assets
        if (path.equals("/health") || path.equals("/healthz") || path.equals("/")) return true;
        // Local-dev convenience: allow unauthenticated access to user profile endpoints.
        // - PUT /api/users/{uid}: used by the login page to upsert the selected demo profile
        // - GET /api/users/{uid}: used by the client to fetch the profile after sign-in
        // In production you should require an ID token, but for emulator-based development we
        // keep these open to avoid coupling with Firebase Admin configuration.
        if (path.startsWith("/api/users") && (
                "PUT".equalsIgnoreCase(request.getMethod()) ||
                "GET".equalsIgnoreCase(request.getMethod())
        )) {
            return true;
        }

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
