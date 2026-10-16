package com.personalos.backend.controller;

import com.personalos.backend.dto.LoginRequest;
import com.personalos.backend.dto.LoginResponse;
import com.personalos.backend.dto.RegisterRequest;
import com.personalos.backend.dto.UserDTO;
import com.personalos.backend.entity.User;
import com.personalos.backend.repository.UserRepository;
import com.personalos.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@Valid @RequestBody RegisterRequest request) {
        UserDTO response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    private ResponseCookie createRefreshTokenCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from("refreshToken", token != null ? token : "")
                .httpOnly(true)
                .secure(false) // in production set true with HTTPS
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        ResponseCookie cookie = createRefreshTokenCookie(response.getRefreshToken(), 30L * 24 * 60 * 60);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @GetMapping("/google/state")
    public ResponseEntity<Map<String, String>> generateGoogleState(HttpServletResponse response) {
        String state = java.util.UUID.randomUUID().toString();

        Cookie cookie = new Cookie("oauth_state", state);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // set to true in prod with HTTPS
        cookie.setPath("/api/auth/google");
        cookie.setMaxAge(300);
        response.addCookie(cookie);

        Map<String, String> body = new HashMap<>();
        body.put("state", state);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> googleLogin(
            @Valid @RequestBody com.personalos.backend.dto.GoogleAuthRequest request,
            @CookieValue(name = "oauth_state", required = false) String oauthStateCookie,
            HttpServletResponse response) {

        if (oauthStateCookie == null || !oauthStateCookie.equals(request.getState())) {
            throw new IllegalArgumentException("Invalid or missing OAuth state");
        }

        Cookie cookie = new Cookie("oauth_state", "");
        cookie.setPath("/api/auth/google");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        LoginResponse loginResponse = authService.googleLogin(request);
        ResponseCookie refreshCookie = createRefreshTokenCookie(loginResponse.getRefreshToken(), 30L * 24 * 60 * 60);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(loginResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) Map<String, String> body) {
        String token = cookieRefreshToken;
        if ((token == null || token.isBlank()) && body != null) {
            token = body.get("refreshToken");
        }

        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "No refresh token provided"));
        }

        try {
            LoginResponse response = authService.refreshToken(token);
            ResponseCookie newCookie = createRefreshTokenCookie(response.getRefreshToken(), 30L * 24 * 60 * 60);
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.SET_COOKIE, newCookie.toString())
                    .body(response);
        } catch (Exception e) {
            ResponseCookie clearCookie = createRefreshTokenCookie("", 0);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header(org.springframework.http.HttpHeaders.SET_COOKIE, clearCookie.toString())
                    .body(Map.of("message", "Invalid or expired refresh token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) Map<String, String> body) {
        String token = cookieRefreshToken;
        if ((token == null || token.isBlank()) && body != null) {
            token = body.get("refreshToken");
        }

        if (token != null && !token.isBlank()) {
            authService.logout(token);
        }

        ResponseCookie clearCookie = createRefreshTokenCookie("", 0);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMe() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("User not found"));

        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setPhone(user.getPhone());
        dto.setBio(user.getBio());
        dto.setAuthProvider(user.getPassword() == null ? "GOOGLE" : "EMAIL");

        return new ResponseEntity<>(dto, HttpStatus.OK);
    }
}
