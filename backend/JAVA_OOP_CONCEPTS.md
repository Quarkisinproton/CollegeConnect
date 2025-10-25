# Java OOP Concepts Documentation

This document explains how all the required Object-Oriented Programming (OOP) concepts are implemented in the CollegeConnect backend Java code.

## 1. Classes and Objects

**What**: A class is a blueprint for creating objects. An object is an instance of a class.

**Where implemented**:
- `Event.java` - Class representing an event entity
- `User.java` - Class representing a user entity
- `EventDto.java` - Data Transfer Object for events
- `UserDto.java` - Data Transfer Object for users
- All service classes, controllers, and utilities

**Example**:
```java
// Class definition
public class Event {
    private String id;
    private String name;
    // ... other fields
}

// Object creation
Event event = new Event();
Event event2 = new Event("Concert", "Music event");
```

## 2. Constructors

**What**: Special methods used to initialize objects when they are created.

**Where implemented**:
- `Event.java` - Multiple constructors (default, parameterized, full)
- `User.java` - Multiple constructors demonstrating overloading
- `BaseService.java` - Constructors with different parameters
- `EventServiceImpl.java` - Constructor with dependency injection
- `UserServiceImpl.java` - Constructor with Firestore injection

**Example from Event.java**:
```java
// Default constructor
public Event() {
    this.createdAt = new Date();
}

// Parameterized constructor
public Event(String name, String description) {
    this();
    this.name = name;
    this.description = description;
}

// Full constructor
public Event(String id, String name, String description, ...) {
    // initialization
}
```

## 3. Methods

**What**: Functions defined within a class that describe the behaviors of objects.

**Where implemented**:
- All classes contain methods
- `EventService.java` - Interface methods (createEvent, getEventById, etc.)
- `EventServiceImpl.java` - Implementation methods
- `Event.java` - Business logic methods (isUpcoming, updateLocation)
- `User.java` - Methods like isAdmin(), isStudent(), updateProfile()

**Example**:
```java
public boolean isUpcoming() {
    if (dateTime == null) {
        return false;
    }
    return dateTime.after(new Date());
}

public void updateProfile(String displayName) {
    this.displayName = displayName;
}
```

## 4. Access Specifiers

**What**: Keywords that control access to classes, methods, and fields (public, private, protected, default).

**Where implemented**:
- **Public**: All interface methods, public getters/setters in model classes
- **Private**: Fields in `Event.java`, `User.java`, helper methods in service implementations
- **Protected**: Fields and methods in `BaseService.java` (accessible to subclasses)

**Example from BaseService.java**:
```java
public class BaseService {
    protected Firestore firestore;        // Protected - accessible to subclasses
    private String serviceName;            // Private - only within this class
    
    public String getServiceName() {       // Public - accessible everywhere
        return serviceName;
    }
    
    protected void log(String message) {   // Protected - accessible to subclasses
        logOperation(message);
    }
    
    private void logOperation(String op) { // Private - only within this class
        System.out.println(serviceName + " - Operation: " + op);
    }
}
```

## 5. Method Overloading

**What**: Multiple methods with the same name but different parameters (number, type, or order).

**Where implemented**:
- `BaseService.java` - processData() with different parameter types
- `Event.java` - updateLocation() with different signatures
- `User.java` - updateProfile() with different parameters
- `Event.java` - Multiple constructors (constructor overloading)

**Example from BaseService.java**:
```java
// Method overloading - same name, different parameters
public void processData(String data) {
    log("Processing string data: " + data);
}

public void processData(Object data) {
    log("Processing object data: " + data.toString());
}

public void processData(String type, Object data) {
    log("Processing " + type + " data: " + data.toString());
}
```

**Example from Event.java**:
```java
public void updateLocation(String locationName) {
    this.locationName = locationName;
}

public void updateLocation(double latitude, double longitude, String locationName) {
    this.locationName = locationName;
    this.location = Map.of("lat", latitude, "lng", longitude);
}

public void updateLocation(Map<String, Object> location, String locationName) {
    this.location = location;
    this.locationName = locationName;
}
```

## 6. Inheritance

**What**: Mechanism where a new class (subclass) is derived from an existing class (superclass), inheriting fields and methods.

**Where implemented**:
- `EventServiceImpl extends BaseService` - Inherits protected fields and methods
- `UserServiceImpl extends BaseService` - Inherits from abstract base class
- `EventValidator extends Validator` - Inherits validation framework
- `UserValidator extends Validator` - Another inheritance example
- `FirebaseAuthFilter extends OncePerRequestFilter` - Spring Boot filter inheritance

**Example**:
```java
// Parent class (abstract)
public abstract class BaseService {
    protected Firestore firestore;
    protected void log(String message) { ... }
}

// Child class inherits from parent
public class EventServiceImpl extends BaseService implements EventService {
    // Inherits firestore field and log() method
    // Can use: this.firestore and this.log()
}
```

## 7. Interface

**What**: A contract that defines methods that implementing classes must provide. Supports multiple inheritance.

**Where implemented**:
- `EventService.java` - Interface defining event operations
- `UserService.java` - Interface defining user operations
- `EventServiceImpl implements EventService` - Implements the interface
- `UserServiceImpl implements UserService` - Implements the interface

**Example from EventService.java**:
```java
public interface EventService {
    Map<String, String> createEvent(EventDto eventDto) throws ExecutionException, InterruptedException;
    Map<String, Object> getEventById(String id) throws ExecutionException, InterruptedException;
    List<Map<String, Object>> getAllEvents() throws ExecutionException, InterruptedException;
    void deleteEvent(String id) throws ExecutionException, InterruptedException;
}

// Implementation
@Service
public class EventServiceImpl extends BaseService implements EventService {
    @Override
    public Map<String, String> createEvent(EventDto dto) {
        // Implementation
    }
    // ... other methods
}
```

## 8. Abstract Methods and Abstract Classes

**What**: Abstract classes cannot be instantiated and may contain abstract methods (methods without implementation) that must be implemented by subclasses.

**Where implemented**:
- `BaseService.java` - Abstract class with abstract methods
  - `abstract String getCollectionName()`
  - `abstract boolean validateData(Object data)`
- `Validator.java` - Abstract validator with abstract methods
  - `abstract boolean validate(T data)`
  - `abstract String getErrorMessage()`

**Example from BaseService.java**:
```java
public abstract class BaseService {
    protected Firestore firestore;
    
    // Abstract method - no implementation
    public abstract String getCollectionName();
    
    // Abstract method - must be implemented by subclasses
    protected abstract boolean validateData(Object data);
    
    // Concrete method - has implementation
    protected void log(String message) {
        System.out.println(message);
    }
}

// Subclass must implement abstract methods
public class EventServiceImpl extends BaseService {
    @Override
    public String getCollectionName() {
        return "events";  // Implementation provided
    }
    
    @Override
    protected boolean validateData(Object data) {
        // Implementation provided
        return data instanceof EventDto;
    }
}
```

**Example from Validator.java**:
```java
public abstract class Validator<T> {
    // Abstract methods
    public abstract boolean validate(T data);
    protected abstract String getErrorMessage();
    
    // Concrete template method using abstract methods
    public final ValidationResult validateWithResult(T data) {
        boolean isValid = validate(data);
        String message = isValid ? "Valid" : getErrorMessage();
        return new ValidationResult(isValid, message);
    }
}

// Concrete implementation
public class EventValidator extends Validator<EventDto> {
    @Override
    public boolean validate(EventDto data) {
        return data != null && data.name != null;
    }
    
    @Override
    protected String getErrorMessage() {
        return "Event validation failed";
    }
}
```

## 9. Packages

**What**: Namespaces that organize classes and interfaces into logical groups.

**Where implemented**:
All Java files are organized into packages:
- `com.collegeconnect` - Root package
- `com.collegeconnect.controllers` - REST controllers
- `com.collegeconnect.service` - Service layer with business logic
- `com.collegeconnect.model` - Domain models/entities
- `com.collegeconnect.dto` - Data Transfer Objects
- `com.collegeconnect.config` - Configuration classes
- `com.collegeconnect.security` - Security-related classes
- `com.collegeconnect.util` - Utility classes

**Example**:
```java
package com.collegeconnect.service;

import com.collegeconnect.dto.EventDto;
import com.google.cloud.firestore.Firestore;
// ... other imports

public class EventServiceImpl extends BaseService implements EventService {
    // Class implementation
}
```

## Summary of All OOP Concepts

| Concept | Files Demonstrating |
|---------|-------------------|
| **Classes** | Event.java, User.java, all service classes, controllers, DTOs |
| **Objects** | Instantiated throughout the application |
| **Methods** | All classes contain methods for behavior |
| **Constructors** | Event.java (3 constructors), User.java (4 constructors), BaseService.java |
| **Access Specifiers** | public (interfaces, getters), private (fields), protected (BaseService) |
| **Method Overloading** | BaseService.processData(), Event.updateLocation(), User.updateProfile() |
| **Inheritance** | EventServiceImpl extends BaseService, UserServiceImpl extends BaseService |
| **Interface** | EventService, UserService implemented by service classes |
| **Abstract Methods** | BaseService (getCollectionName, validateData), Validator (validate) |
| **Packages** | Organized in com.collegeconnect.* hierarchy |

## How to Test These Concepts

1. **Build the project**: `cd backend && mvn clean compile`
2. **Run tests**: `mvn test`
3. **Start the application**: `mvn spring-boot:run`
4. **Test endpoints**: Use the REST API to see classes and objects in action

## Additional OOP Features Present

- **Encapsulation**: Private fields with public getters/setters
- **Polymorphism**: Interface implementations can be used interchangeably
- **Composition**: Services use Firestore, validators, etc.
- **Dependency Injection**: Spring @Autowired annotations
- **Generics**: Validator<T> uses generics
- **Method Overriding**: @Override annotations throughout

All required OOP concepts are comprehensively demonstrated in the backend Java codebase.
