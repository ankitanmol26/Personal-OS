package com.personalos.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AddTripMemberRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    public AddTripMemberRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
