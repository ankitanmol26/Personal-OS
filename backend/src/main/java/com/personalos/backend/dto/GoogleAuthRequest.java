package com.personalos.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleAuthRequest {
    @NotBlank
    private String code;
    
    @NotBlank
    private String redirectUri;

    @NotBlank
    private String state;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getRedirectUri() { return redirectUri; }
    public void setRedirectUri(String redirectUri) { this.redirectUri = redirectUri; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
