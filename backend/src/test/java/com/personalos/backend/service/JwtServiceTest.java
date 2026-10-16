package com.personalos.backend.service;

import com.personalos.backend.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String VALID_SECRET = "very-secure-and-long-jwt-secret-key-for-testing-personalos-application-production-readiness";

    @Test
    void validateSecretKey_validSecret_succeeds() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", VALID_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3600000L);

        assertDoesNotThrow(jwtService::validateSecretKey);

        User user = new User();
        user.setId(10L);
        user.setEmail("test@example.com");

        String token = jwtService.generateToken(user);
        assertNotNull(token);
        assertEquals("test@example.com", jwtService.extractUsername(token));
        assertEquals(10L, jwtService.extractUserId(token));
    }

    @Test
    void validateSecretKey_nullOrEmpty_throwsException() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", null);
        assertThrows(IllegalStateException.class, jwtService::validateSecretKey);

        ReflectionTestUtils.setField(jwtService, "secretKey", "   ");
        assertThrows(IllegalStateException.class, jwtService::validateSecretKey);
    }

    @Test
    void validateSecretKey_tooShort_throwsException() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "short-secret");
        assertThrows(IllegalStateException.class, jwtService::validateSecretKey);
    }
}
