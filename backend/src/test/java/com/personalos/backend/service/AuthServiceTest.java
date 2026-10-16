package com.personalos.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.personalos.backend.dto.GoogleAuthRequest;
import com.personalos.backend.dto.LoginResponse;
import com.personalos.backend.entity.GoogleIdentity;
import com.personalos.backend.entity.User;
import com.personalos.backend.repository.GoogleIdentityRepository;
import com.personalos.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private GoogleIdentityRepository googleIdentityRepository;
    @Mock
    private GoogleTokenValidator googleTokenValidator;
    @Mock
    private RefreshTokenService refreshTokenService;

    private AuthService authService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        com.personalos.backend.entity.RefreshToken mockRt = new com.personalos.backend.entity.RefreshToken();
        mockRt.setToken("mock-refresh-token");
        org.mockito.Mockito.when(refreshTokenService.createRefreshToken(org.mockito.ArgumentMatchers.any())).thenReturn(mockRt);
        authService = new AuthService(userRepository, passwordEncoder, authenticationManager, jwtService, googleIdentityRepository, googleTokenValidator, refreshTokenService);
        ReflectionTestUtils.setField(authService, "clientId", "test-client-id");
        ReflectionTestUtils.setField(authService, "clientSecret", "test-client-secret");
    }

    @Test
    public void testValidNewGoogleUser() throws Exception {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setCode("auth-code");
        request.setRedirectUri("http://localhost");

        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setAudience("test-client-id");
        payload.setEmailVerified(true);
        payload.setSubject("google-sub-123");
        payload.setEmail("newuser@gmail.com");
        payload.set("name", "New User");

        when(googleTokenValidator.exchangeAndVerify(any(), any(), any(), any())).thenReturn(payload);
        when(googleIdentityRepository.findByGoogleSub("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("newuser@gmail.com")).thenReturn(false);

        User savedUser = new User();
        savedUser.setId(100L);
        savedUser.setEmail("newuser@gmail.com");
        savedUser.setName("New User");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(any(User.class))).thenReturn("mock-jwt-token");

        LoginResponse response = authService.googleLogin(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getAccessToken());
        assertEquals(100L, response.getUserId());

        verify(userRepository).save(any(User.class));
        verify(googleIdentityRepository).save(any(GoogleIdentity.class));
    }

    @Test
    public void testReturningGoogleUser() throws Exception {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setCode("auth-code");
        request.setRedirectUri("http://localhost");

        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setAudience("test-client-id");
        payload.setEmailVerified(true);
        payload.setSubject("google-sub-123");
        payload.setEmail("newuser@gmail.com");

        when(googleTokenValidator.exchangeAndVerify(any(), any(), any(), any())).thenReturn(payload);

        User existingUser = new User();
        existingUser.setId(100L);

        GoogleIdentity existingIdentity = new GoogleIdentity();
        existingIdentity.setUser(existingUser);
        existingIdentity.setGoogleSub("google-sub-123");

        when(googleIdentityRepository.findByGoogleSub("google-sub-123")).thenReturn(Optional.of(existingIdentity));
        when(jwtService.generateToken(existingUser)).thenReturn("mock-jwt-token");

        LoginResponse response = authService.googleLogin(request);
        assertEquals(100L, response.getUserId());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testWrongAudience() throws Exception {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setCode("auth-code");
        request.setRedirectUri("http://localhost");

        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setAudience("wrong-client-id");

        when(googleTokenValidator.exchangeAndVerify(any(), any(), any(), any())).thenReturn(payload);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            authService.googleLogin(request);
        });
        assertTrue(ex.getMessage().contains("Invalid audience"));
    }

    @Test
    public void testUnverifiedEmail() throws Exception {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setCode("auth-code");
        request.setRedirectUri("http://localhost");

        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setAudience("test-client-id");
        payload.setEmailVerified(false);

        when(googleTokenValidator.exchangeAndVerify(any(), any(), any(), any())).thenReturn(payload);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            authService.googleLogin(request);
        });
        assertTrue(ex.getMessage().contains("email not verified"));
    }

    @Test
    public void testAccountExistsLocally() throws Exception {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setCode("auth-code");
        request.setRedirectUri("http://localhost");

        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setAudience("test-client-id");
        payload.setEmailVerified(true);
        payload.setSubject("google-sub-123");
        payload.setEmail("existing@gmail.com");

        when(googleTokenValidator.exchangeAndVerify(any(), any(), any(), any())).thenReturn(payload);
        when(googleIdentityRepository.findByGoogleSub("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("existing@gmail.com")).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            authService.googleLogin(request);
        });
        assertEquals("ACCOUNT_EXISTS_LOCALLY", ex.getMessage());
    }

    @Test
    public void testMissingGoogleConfiguration() {
        ReflectionTestUtils.setField(authService, "clientId", "not-configured");

        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setCode("auth-code");
        request.setRedirectUri("http://localhost");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            authService.googleLogin(request);
        });
        assertEquals("Google OAuth is not configured on this server", ex.getMessage());
    }
}
