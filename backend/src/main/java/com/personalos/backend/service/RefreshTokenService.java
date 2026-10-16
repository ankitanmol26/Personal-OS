package com.personalos.backend.service;

import com.personalos.backend.entity.RefreshToken;
import com.personalos.backend.entity.User;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Value("${personalos.jwt.refresh-expiration-ms:2592000000}") // 30 days
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setToken(UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString());
        refreshToken.setRevoked(false);

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0 || token.isRevoked()) {
            refreshTokenRepository.delete(token);
            throw new IllegalArgumentException("Refresh token was expired or revoked. Please sign in again.");
        }
        return token;
    }

    @Transactional
    public RefreshToken rotateRefreshToken(String oldToken) {
        RefreshToken token = refreshTokenRepository.findByToken(oldToken)
                .orElseThrow(() -> new ResourceNotFoundException("Refresh token not found"));

        verifyExpiration(token);
        User user = token.getUser();
        refreshTokenRepository.delete(token);

        return createRefreshToken(user);
    }

    @Transactional
    public void revokeRefreshToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshTokenRepository::delete);
    }

    @Transactional
    public void revokeAllUserTokens(User user) {
        refreshTokenRepository.deleteByUser(user);
    }
}
