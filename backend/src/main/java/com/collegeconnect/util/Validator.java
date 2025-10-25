package com.collegeconnect.util;

/**
 * Abstract validator class demonstrating:
 * - Abstract class with abstract methods
 * - Template method pattern
 * - Protected and public access specifiers
 */
public abstract class Validator<T> {
    
    // Protected field accessible to subclasses
    protected String validatorName;
    
    // Constructor
    public Validator(String validatorName) {
        this.validatorName = validatorName;
    }
    
    // Abstract method that must be implemented by subclasses
    public abstract boolean validate(T data);
    
    // Abstract method for getting validation error message
    protected abstract String getErrorMessage();
    
    // Template method that uses abstract methods
    public final ValidationResult validateWithResult(T data) {
        boolean isValid = validate(data);
        String message = isValid ? "Validation passed" : getErrorMessage();
        return new ValidationResult(isValid, message);
    }
    
    // Public method available to all
    public String getValidatorName() {
        return validatorName;
    }
    
    /**
     * Inner class demonstrating nested class concept
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String message;
        
        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }
        
        public boolean isValid() {
            return valid;
        }
        
        public String getMessage() {
            return message;
        }
    }
}
