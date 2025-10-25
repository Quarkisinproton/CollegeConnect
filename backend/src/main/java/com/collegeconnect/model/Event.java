package com.collegeconnect.model;

import java.util.Date;
import java.util.Map;

/**
 * Event model class demonstrating:
 * - Class concept
 * - Object creation
 * - Constructors (default and parameterized)
 * - Access specifiers (private fields, public methods)
 * - Encapsulation (getters and setters)
 * - Method overloading
 */
public class Event {
    
    // Private fields - demonstrating encapsulation
    private String id;
    private String name;
    private String description;
    private Date dateTime;
    private Map<String, Object> location;
    private String locationName;
    private String createdBy;
    private String creatorName;
    private Date createdAt;
    
    // Default constructor
    public Event() {
        this.createdAt = new Date();
    }
    
    // Constructor with essential fields - demonstrating constructor overloading
    public Event(String name, String description) {
        this();
        this.name = name;
        this.description = description;
    }
    
    // Constructor with more fields - another overloaded constructor
    public Event(String name, String description, Date dateTime, String locationName) {
        this(name, description);
        this.dateTime = dateTime;
        this.locationName = locationName;
    }
    
    // Full constructor - yet another overloaded constructor
    public Event(String id, String name, String description, Date dateTime, 
                 Map<String, Object> location, String locationName, 
                 String createdBy, String creatorName, Date createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.dateTime = dateTime;
        this.location = location;
        this.locationName = locationName;
        this.createdBy = createdBy;
        this.creatorName = creatorName;
        this.createdAt = createdAt;
    }
    
    // Public getter methods - demonstrating access specifiers
    public String getId() {
        return id;
    }
    
    public String getName() {
        return name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public Date getDateTime() {
        return dateTime;
    }
    
    public Map<String, Object> getLocation() {
        return location;
    }
    
    public String getLocationName() {
        return locationName;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public String getCreatorName() {
        return creatorName;
    }
    
    public Date getCreatedAt() {
        return createdAt;
    }
    
    // Public setter methods - demonstrating encapsulation
    public void setId(String id) {
        this.id = id;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public void setDateTime(Date dateTime) {
        this.dateTime = dateTime;
    }
    
    public void setLocation(Map<String, Object> location) {
        this.location = location;
    }
    
    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }
    
    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
    
    // Method demonstrating business logic
    public boolean isUpcoming() {
        if (dateTime == null) {
            return false;
        }
        return dateTime.after(new Date());
    }
    
    // Method overloading - different parameter types
    public void updateLocation(String locationName) {
        this.locationName = locationName;
    }
    
    // Overloaded method with different parameters
    public void updateLocation(double latitude, double longitude, String locationName) {
        this.locationName = locationName;
        this.location = Map.of("lat", latitude, "lng", longitude);
    }
    
    // Overloaded method with Map parameter
    public void updateLocation(Map<String, Object> location, String locationName) {
        this.location = location;
        this.locationName = locationName;
    }
    
    // Override toString method for better object representation
    @Override
    public String toString() {
        return "Event{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", dateTime=" + dateTime +
                ", locationName='" + locationName + '\'' +
                ", createdBy='" + createdBy + '\'' +
                '}';
    }
}
