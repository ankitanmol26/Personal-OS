package com.personalos.backend.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.StompWebSocketEndpointRegistration;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AllowedOriginsAndCorsTest {

    @Test
    public void testProductionOriginParsingAndLocalhostExclusion() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        // Trailing slashes and spaces should be safely sanitized
        String prodFrontendUrl = "https://personalos.vercel.app/ , https://preview.vercel.app///";
        AllowedOriginsProvider provider = new AllowedOriginsProvider(prodEnv, prodFrontendUrl, true);

        List<String> origins = provider.getAllowedOrigins();

        assertEquals(2, origins.size());
        assertTrue(origins.contains("https://personalos.vercel.app"));
        assertTrue(origins.contains("https://preview.vercel.app"));
        assertFalse(origins.contains("http://localhost:5173"), "Production must not allow localhost:5173");
        assertFalse(origins.contains("http://localhost:5174"), "Production must not allow localhost:5174");
        assertFalse(origins.contains("*"), "Wildcard origins must never be allowed");
    }

    @Test
    public void testProductionWithEmptyOriginSafelyRestricts() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        AllowedOriginsProvider provider = new AllowedOriginsProvider(prodEnv, "", true);
        List<String> origins = provider.getAllowedOrigins();

        assertTrue(origins.isEmpty(), "Production without configured URL must have empty origins list to reject cross-origin requests");
        assertFalse(origins.contains("http://localhost:5173"));
        assertFalse(origins.contains("*"));
    }

    @Test
    public void testDevelopmentProfileIncludesLocalhost() {
        MockEnvironment devEnv = new MockEnvironment();
        // default / dev profile
        AllowedOriginsProvider provider = new AllowedOriginsProvider(devEnv, "http://localhost:3000/", true);
        List<String> origins = provider.getAllowedOrigins();

        assertTrue(origins.contains("http://localhost:3000"));
        assertTrue(origins.contains("http://localhost:5173"));
        assertTrue(origins.contains("http://localhost:5174"));
    }

    @Test
    public void testCorsConfigurationRejectsUnconfiguredOriginsInProd() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        AllowedOriginsProvider provider = new AllowedOriginsProvider(prodEnv, "https://personalos.vercel.app", true);
        SecurityConfig securityConfig = new SecurityConfig(null, provider);

        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        assertNotNull(source);

        org.springframework.mock.web.MockHttpServletRequest request = new org.springframework.mock.web.MockHttpServletRequest();
        request.setRequestURI("/api/tasks");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertNotNull(config);
        assertTrue(Boolean.TRUE.equals(config.getAllowCredentials()), "Credentials must be enabled for cookie authentication");

        // Check configured origin is accepted
        assertEquals("https://personalos.vercel.app", config.checkOrigin("https://personalos.vercel.app"));

        // Check unconfigured origin is rejected (returns null)
        assertNull(config.checkOrigin("https://evil-attacker.com"), "Unconfigured origin must be rejected");

        // Check localhost is rejected in prod
        assertNull(config.checkOrigin("http://localhost:5173"), "Localhost must be rejected in production");
        assertNull(config.checkOrigin("http://localhost:5174"), "Localhost:5174 must be rejected in production");

        // Check allowed methods and headers
        assertTrue(config.getAllowedMethods().containsAll(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")));
        assertTrue(config.getAllowedHeaders().contains("Authorization"));
        assertTrue(config.getAllowedHeaders().contains("Idempotency-Key"));
        assertTrue(config.getExposedHeaders().contains("Set-Cookie"));
        assertTrue(config.getExposedHeaders().contains("Idempotency-Key"));
    }

    @Test
    public void testWebSocketOriginConsistencyWithCors() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        AllowedOriginsProvider provider = new AllowedOriginsProvider(prodEnv, "https://personalos.vercel.app", true);
        WebSocketConfig webSocketConfig = new WebSocketConfig(provider);

        StompEndpointRegistry registry = mock(StompEndpointRegistry.class);
        StompWebSocketEndpointRegistration registration = mock(StompWebSocketEndpointRegistration.class);

        when(registry.addEndpoint("/ws")).thenReturn(registration);
        when(registration.setAllowedOrigins(any())).thenReturn(registration);
        when(registration.withSockJS()).thenReturn(null);

        webSocketConfig.registerStompEndpoints(registry);

        // Verify that setAllowedOrigins was called with the exact allowed origins from AllowedOriginsProvider
        verify(registration, times(2)).setAllowedOrigins(new String[]{"https://personalos.vercel.app"});
    }

    @Test
    public void testStrictOriginValidationRejectsMalformedAndInsecure() {
        AllowedOriginsProvider provider = new AllowedOriginsProvider(new MockEnvironment(), "", false);

        // Valid origins
        assertTrue(provider.isValidOrigin("https://personalos.vercel.app"));
        assertTrue(provider.isValidOrigin("http://localhost:5173"));
        assertTrue(provider.isValidOrigin("https://my-app.vercel.app:8443"));

        // Malformed or invalid origins
        assertFalse(provider.isValidOrigin(null));
        assertFalse(provider.isValidOrigin(""));
        assertFalse(provider.isValidOrigin("   "));
        assertFalse(provider.isValidOrigin("not-a-url"));
        assertFalse(provider.isValidOrigin("https://"));
        assertFalse(provider.isValidOrigin("ftp://example.com"), "FTP scheme must be rejected");
        assertFalse(provider.isValidOrigin("javascript:alert(1)"), "JavaScript scheme must be rejected");
        assertFalse(provider.isValidOrigin("https://user:password@example.com"), "Credentials in origin must be rejected");
        assertFalse(provider.isValidOrigin("https://example.com/api/tasks"), "Path in origin must be rejected");
        assertFalse(provider.isValidOrigin("https://example.com?query=1"), "Query string in origin must be rejected");
        assertFalse(provider.isValidOrigin("https://example.com#section"), "Fragment in origin must be rejected");
        assertFalse(provider.isValidOrigin("https://example.com:notaport"), "Invalid port must be rejected");
        assertFalse(provider.isValidOrigin("https://example.com:"), "Empty port colon must be rejected");
    }

    @Test
    public void testOriginsProviderFiltersOutMalformedAndDeduplicates() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");

        String mixedConfig = "https://personalos.vercel.app/, ftp://bad.com, https://personalos.vercel.app, https://evil.com/path, https://evil.com?bad=1, https://preview.vercel.app";
        AllowedOriginsProvider provider = new AllowedOriginsProvider(prodEnv, mixedConfig, false);

        List<String> origins = provider.getAllowedOrigins();

        assertEquals(2, origins.size(), "Only the 2 valid origins should be accepted without duplicates");
        assertTrue(origins.contains("https://personalos.vercel.app"));
        assertTrue(origins.contains("https://preview.vercel.app"));
        assertFalse(origins.contains("ftp://bad.com"));
        assertFalse(origins.contains("https://evil.com/path"));
        assertFalse(origins.contains("https://evil.com?bad=1"));
    }
}
