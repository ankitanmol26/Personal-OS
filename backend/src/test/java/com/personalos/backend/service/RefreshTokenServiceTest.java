package com.personalos.backend.service;

import com.personalos.backend.entity.RefreshToken;
import com.personalos.backend.entity.User;
import com.personalos.backend.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenService refreshTokenService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        refreshTokenService = new RefreshTokenService(refreshTokenRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(refreshTokenService, "refreshTokenDurationMs", 2592000000L);
    }

    @Test
    public void testCreateRefreshToken() {
        User user = new User();
        user.setId(1L);
        user.setEmail("user@example.com");

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RefreshToken token = refreshTokenService.createRefreshToken(user);

        assertNotNull(token);
        assertNotNull(token.getToken());
        assertEquals(user, token.getUser());
        assertFalse(token.isRevoked());
        assertTrue(token.getExpiryDate().isAfter(java.time.Instant.now()));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    public void testRotateRefreshTokenSuccess() {
        User user = new User();
        user.setId(1L);

        RefreshToken oldToken = new RefreshToken();
        oldToken.setToken("old-token-xyz");
        oldToken.setUser(user);
        oldToken.setRevoked(false);
        oldToken.setExpiryDate(java.time.Instant.now().plus(java.time.Duration.ofDays(7)));

        when(refreshTokenRepository.findByToken("old-token-xyz")).thenReturn(Optional.of(oldToken));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RefreshToken newToken = refreshTokenService.rotateRefreshToken("old-token-xyz");

        assertNotNull(newToken);
        assertNotEquals("old-token-xyz", newToken.getToken());
        verify(refreshTokenRepository).delete(oldToken);
    }

    @Test
    public void testRotateExpiredOrRevokedTokenFails() {
        RefreshToken revokedToken = new RefreshToken();
        revokedToken.setToken("revoked-token");
        revokedToken.setRevoked(true);
        revokedToken.setExpiryDate(java.time.Instant.now().plus(java.time.Duration.ofDays(7)));

        when(refreshTokenRepository.findByToken("revoked-token")).thenReturn(Optional.of(revokedToken));

        assertThrows(IllegalArgumentException.class, () -> refreshTokenService.rotateRefreshToken("revoked-token"));
    }

    @Test
    public void testRevokeRefreshToken() {
        RefreshToken token = new RefreshToken();
        token.setToken("active-token");
        token.setRevoked(false);

        when(refreshTokenRepository.findByToken("active-token")).thenReturn(Optional.of(token));

        refreshTokenService.revokeRefreshToken("active-token");

        verify(refreshTokenRepository).delete(token);
    }
}
