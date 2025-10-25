package com.collegeconnect.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SimpleCorsFilter extends OncePerRequestFilter {

    public SimpleCorsFilter() {
        System.out.println("========================================");
        System.out.println("SimpleCorsFilter LOADED AND ACTIVE");
        System.out.println("========================================");
    }

    private boolean isAllowedOrigin(String origin) {
        if (origin == null) return false;
        // Allow all vercel.app subdomains and localhost
        return origin.startsWith("https://") && origin.contains(".vercel.app") 
            || origin.matches("^https?://(localhost|127.0.0.1)(:\\d+)?$");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String origin = request.getHeader("Origin");
        String method = request.getMethod();
        String path = request.getRequestURI();
        
        System.out.println("SimpleCorsFilter: " + method + " " + path + " from origin: " + origin);
        
        // Always set CORS headers for allowed origins
        if (isAllowedOrigin(origin)) {
            System.out.println("SimpleCorsFilter: Origin ALLOWED, setting CORS headers");
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
            response.setHeader("Access-Control-Max-Age", "3600");
        } else {
            System.out.println("SimpleCorsFilter: Origin NOT ALLOWED or null");
        }
        response.addHeader("Vary", "Origin");

        // Immediately return 200 for OPTIONS preflight
        if ("OPTIONS".equalsIgnoreCase(method)) {
            System.out.println("SimpleCorsFilter: OPTIONS detected, returning 200 OK");
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().flush();
            return;
        }

        filterChain.doFilter(request, response);
    }
}