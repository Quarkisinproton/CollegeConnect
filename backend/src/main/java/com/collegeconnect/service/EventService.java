package com.collegeconnect.service;

import com.collegeconnect.dto.EventDto;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/**
 * Interface demonstrating interface concept in Java
 * Defines contract for event-related operations
 */
public interface EventService {
    
    /**
     * Creates a new event
     * @param eventDto Event data transfer object
     * @return Map containing the created event ID
     * @throws ExecutionException if async operation fails
     * @throws InterruptedException if async operation is interrupted
     */
    Map<String, String> createEvent(EventDto eventDto) throws ExecutionException, InterruptedException;
    
    /**
     * Retrieves an event by ID
     * @param id Event identifier
     * @return Map containing event data
     * @throws ExecutionException if async operation fails
     * @throws InterruptedException if async operation is interrupted
     */
    Map<String, Object> getEventById(String id) throws ExecutionException, InterruptedException;
    
    /**
     * Retrieves all events
     * @return List of all events
     * @throws ExecutionException if async operation fails
     * @throws InterruptedException if async operation is interrupted
     */
    List<Map<String, Object>> getAllEvents() throws ExecutionException, InterruptedException;
    
    /**
     * Deletes an event by ID
     * @param id Event identifier
     * @throws ExecutionException if async operation fails
     * @throws InterruptedException if async operation is interrupted
     */
    void deleteEvent(String id) throws ExecutionException, InterruptedException;
}
