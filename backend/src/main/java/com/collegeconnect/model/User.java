package com.collegeconnect.model;

import java.util.Date;

/**
 * User model class demonstrating:
 * - Class and object concepts
 * - Multiple constructors
 * - Private fields with public accessors
 * - Encapsulation
 */
public class User {
    
    // Private fields
    private String uid;
    private String email;
    private String displayName;
    private String role;
    private Date createdAt;
    private Date lastLogin;
    
    // Default constructor
    public User() {
        this.createdAt = new Date();
    }
    
    // Constructor with UID
    public User(String uid) {
        this();
        this.uid = uid;
    }
    
    // Constructor with essential fields - constructor overloading
    public User(String uid, String email, String displayName) {
        this(uid);
        this.email = email;
        this.displayName = displayName;
        this.role = "student"; // default role
    }
    
    // Full constructor - another overloaded constructor
    public User(String uid, String email, String displayName, String role, Date createdAt) {
        this.uid = uid;
        this.email = email;
        this.displayName = displayName;
        this.role = role;
        this.createdAt = createdAt;
    }
    
    // Getters - public access methods
    public String getUid() {
        return uid;
    }
    
    public String getEmail() {
        return email;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getRole() {
        return role;
    }
    
    public Date getCreatedAt() {
        return createdAt;
    }
    
    public Date getLastLogin() {
        return lastLogin;
    }
    
    // Setters - public mutator methods
    public void setUid(String uid) {
        this.uid = uid;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
    
    public void setLastLogin(Date lastLogin) {
        this.lastLogin = lastLogin;
    }
    
    // Business logic methods
    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(this.role);
    }
    
    public boolean isStudent() {
        return "student".equalsIgnoreCase(this.role);
    }
    
    public void updateLastLogin() {
        this.lastLogin = new Date();
    }
    
    // Method overloading - different ways to update profile
    public void updateProfile(String displayName) {
        this.displayName = displayName;
    }
    
    public void updateProfile(String displayName, String email) {
        this.displayName = displayName;
        this.email = email;
    }
    
    @Override
    public String toString() {
        return "User{" +
                "uid='" + uid + '\'' +
                ", email='" + email + '\'' +
                ", displayName='" + displayName + '\'' +
                ", role='" + role + '\'' +
                '}';
    }
}
