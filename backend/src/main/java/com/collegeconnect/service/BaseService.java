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
    
    // Protected field
    protected Firestore firestore;
    
    // Private field 
    private String serviceName;
    
    // Default constructor
    public BaseService() {
        this.serviceName = "BaseService";
    }
    
    // Constructor with parameter
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
    
    protected Firestore getFirestore() {
        return this.firestore;
    }
    
    private void logOperation(String operation) {
        System.out.println(serviceName + " - Operation: " + operation);
    }
    
    protected void log(String message) {
        logOperation(message);
    }
    
    public abstract String getCollectionName();
    
    // for validation
    protected abstract boolean validateData(Object data);
    
    public void processData(String data) {
        log("Processing string data: " + data);
    }
    
    public void processData(Object data) {
        log("Processing object data: " + data.toString());
    }
    
    public void processData(String type, Object data) {
        log("Processing " + type + " data: " + data.toString());
    }
}
