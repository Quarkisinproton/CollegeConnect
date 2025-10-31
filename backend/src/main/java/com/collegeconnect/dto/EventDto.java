package com.collegeconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public class EventDto {
    @NotBlank
    public String name;

    @NotBlank
    public String description;

    @NotBlank
    public String dateTime;

    @NotNull
    public Map<String, Object> location;

    @NotBlank
    public String locationName;

    @NotBlank
    public String createdBy;

    public String creatorName;

    public String createdAt;

    public EventDto() {}
}
