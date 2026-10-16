package com.personalos.backend.service;

import com.personalos.backend.dto.LoginRequest;
import com.personalos.backend.dto.LoginResponse;
import com.personalos.backend.dto.RegisterRequest;
import com.personalos.backend.dto.UserDTO;
import com.personalos.backend.entity.User;
import com.personalos.backend.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.personalos.backend.dto.GoogleAuthRequest;
import com.personalos.backend.entity.GoogleIdentity;
import com.personalos.backend.repository.GoogleIdentityRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final GoogleIdentityRepository googleIdentityRepository;
    private final GoogleTokenValidator googleTokenValidator;
    private final RefreshTokenService refreshTokenService;

    @Value("${google.oauth.client-id:${GOOGLE_OAUTH_CLIENT_ID:not-configured}}")
    private String clientId;

    @Value("${google.oauth.client-secret:${GOOGLE_OAUTH_CLIENT_SECRET:not-configured}}")
    private String clientSecret;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       GoogleIdentityRepository googleIdentityRepository,
                       GoogleTokenValidator googleTokenValidator,
                       RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.googleIdentityRepository = googleIdentityRepository;
        this.googleTokenValidator = googleTokenValidator;
        this.refreshTokenService = refreshTokenService;
    }

    public UserDTO register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        UserDTO dto = new UserDTO();
        dto.setId(savedUser.getId());
        dto.setName(savedUser.getName());
        dto.setEmail(savedUser.getEmail());
        dto.setAvatarUrl(savedUser.getAvatarUrl());
        return dto;
    }

    public LoginResponse login(LoginRequest request) {
        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());
        if (optionalUser.isPresent()) {
            User existing = optionalUser.get();
            if (existing.getPassword() == null || existing.getPassword().isEmpty()) {
                throw new org.springframework.security.authentication.BadCredentialsException(
                        "This account was registered using Google Sign-In. Please sign in with Google."
                );
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            // Fetch the user to get ID and Name for the response
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("User not found after successful auth"));

            LoginResponse response = new LoginResponse();
            response.setUserId(user.getId());
            response.setName(user.getName());
            response.setEmail(user.getEmail());
            response.setAvatarUrl(user.getAvatarUrl());
            response.setMessage("Login successful");

            String jwtToken = jwtService.generateToken(user);
            response.setAccessToken(jwtToken);
            response.setTokenType("Bearer");

            com.personalos.backend.entity.RefreshToken rt = refreshTokenService.createRefreshToken(user);
            response.setRefreshToken(rt.getToken());

            return response;
        } catch (AuthenticationException e) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid email or password");
        }
    }

    @Transactional
    public LoginResponse googleLogin(GoogleAuthRequest request) {
        if ("not-configured".equals(clientId) || "not-configured".equals(clientSecret)) {
            throw new IllegalStateException("Google OAuth is not configured on this server");
        }

        try {
            String redirectUri = request.getRedirectUri();
            if (redirectUri == null || redirectUri.isBlank()
                    || redirectUri.startsWith("http://localhost")
                    || redirectUri.startsWith("http://127.0.0.1")) {
                redirectUri = "postmessage";
            }
            GoogleIdToken.Payload payload = googleTokenValidator.exchangeAndVerify(clientId, clientSecret, request.getCode(), redirectUri);

            // Validate audience
            if (!payload.getAudience().equals(clientId) && !payload.getAudienceAsList().contains(clientId)) {
                throw new IllegalArgumentException("Invalid audience in ID token");
            }

            // Check email_verified
            Boolean emailVerified = payload.getEmailVerified();
            if (emailVerified == null || !emailVerified) {
                throw new IllegalArgumentException("Google email not verified");
            }

            String sub = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            // Account resolution
            Optional<GoogleIdentity> optionalIdentity = googleIdentityRepository.findByGoogleSub(sub);
            User user;
            if (optionalIdentity.isPresent()) {
                user = optionalIdentity.get().getUser();
                // Profile sync policy: we can update avatar if changed, but we won't overwrite name silently.
                if (picture != null && !picture.equals(user.getAvatarUrl())) {
                    user.setAvatarUrl(picture);
                    user = userRepository.save(user);
                }
            } else {
                if (userRepository.existsByEmail(email)) {
                    throw new IllegalStateException("ACCOUNT_EXISTS_LOCALLY");
                }

                user = new User();
                user.setEmail(email);
                user.setName(name);
                user.setAvatarUrl(picture);
                user.setCreatedAt(LocalDateTime.now());
                // password is null for Google-only users
                user = userRepository.save(user);

                GoogleIdentity identity = new GoogleIdentity();
                identity.setUser(user);
                identity.setGoogleSub(sub);
                identity.setCreatedAt(LocalDateTime.now());
                googleIdentityRepository.save(identity);
            }

            String jwtToken = jwtService.generateToken(user);
            LoginResponse response = new LoginResponse();
            response.setUserId(user.getId());
            response.setName(user.getName());
            response.setEmail(user.getEmail());
            response.setAvatarUrl(user.getAvatarUrl());
            response.setMessage("Google login successful");
            response.setAccessToken(jwtToken);
            response.setTokenType("Bearer");

            com.personalos.backend.entity.RefreshToken rt = refreshTokenService.createRefreshToken(user);
            response.setRefreshToken(rt.getToken());

            return response;

        } catch (Exception e) {
            if (e instanceof IllegalStateException) {
                throw (IllegalStateException) e;
            }
            throw new IllegalArgumentException("Google token exchange failed: " + e.getMessage());
        }
    }

    @Transactional
    public LoginResponse refreshToken(String tokenString) {
        com.personalos.backend.entity.RefreshToken newRt = refreshTokenService.rotateRefreshToken(tokenString);
        User user = newRt.getUser();

        String jwtToken = jwtService.generateToken(user);
        LoginResponse response = new LoginResponse();
        response.setUserId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setMessage("Token refreshed");
        response.setAccessToken(jwtToken);
        response.setTokenType("Bearer");
        response.setRefreshToken(newRt.getToken());

        return response;
    }

    @Transactional
    public void logout(String tokenString) {
        if (tokenString != null && !tokenString.isBlank()) {
            refreshTokenService.revokeRefreshToken(tokenString);
        }
    }
}
