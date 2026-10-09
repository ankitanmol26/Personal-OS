package com.personalos.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public class ProfileUpdateRequest {

    @NotBlank(message = "Name cannot be blank")
    @Size(max = 255, message = "Name must be less than 255 characters")
    private String name;

    @URL(message = "Avatar URL must be a valid HTTP or HTTPS URL", protocol = "https")
    @Size(max = 2048, message = "Avatar URL must be less than 2048 characters")
    private String avatarUrl;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
