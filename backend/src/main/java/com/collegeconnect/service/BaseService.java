package com.collegeconnect.service;

import com.google.cloud.firestore.Firestore;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Abstract base class demonstrating:
 * - Abstract class concept
 * - Access specifiers (public, protected, private)
 * - Constructors
 * - Abstract methods
 */
public abstract class BaseService {
    
    // Protected field - accessible by subclasses
    protected Firestore firestore;
    
    // Private field - only accessible within this class
    private String serviceName;
    
    // Default constructor
    public BaseService() {
        this.serviceName = "BaseService";
    }
    
    // Constructor with parameter - demonstrating constructor overloading
    public BaseService(String serviceName) {
        this.serviceName = serviceName;
    }
    
    // Constructor with Firestore injection
    @Autowired
    public BaseService(Firestore firestore) {
        this.firestore = firestore;
        this.serviceName = "BaseService";
    }
    
    // Public getter method
    public String getServiceName() {
        return serviceName;
    }
    
    // Public setter method
    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }
    
    // Protected method - accessible by subclasses
    protected Firestore getFirestore() {
        return this.firestore;
    }
    
    // Private helper method - only accessible within this class
    private void logOperation(String operation) {
        System.out.println(serviceName + " - Operation: " + operation);
    }
    
    // Protected helper method that can be used by subclasses
    protected void log(String message) {
        logOperation(message);
    }
    
    // Abstract method - must be implemented by subclasses
    public abstract String getCollectionName();
    
    // Abstract method for validation
    protected abstract boolean validateData(Object data);
    
    // Method overloading - same name, different parameters
    public void processData(String data) {
        log("Processing string data: " + data);
    }
    
    // Method overloading - different parameter type
    public void processData(Object data) {
        log("Processing object data: " + data.toString());
    }
    
    // Method overloading - multiple parameters
    public void processData(String type, Object data) {
        log("Processing " + type + " data: " + data.toString());
    }
}
