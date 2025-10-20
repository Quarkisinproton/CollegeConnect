package com.collegeconnect.dto;

import jakarta.validation.constraints.NotBlank;

public class UserDto {
    @NotBlank
    public String uid;

    public String email;

    @NotBlank
    public String displayName;

    @NotBlank
    public String role;

    public String createdAt; // ISO string

    public UserDto() {}
}
