package com.personalos.backend.controller;

import com.personalos.backend.dto.GoogleAuthRequest;
import com.personalos.backend.dto.LoginResponse;
import com.personalos.backend.repository.UserRepository;
import com.personalos.backend.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class AuthControllerTest {

    @Mock
    private AuthService authService;
    
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGenerateGoogleState() {
        MockHttpServletResponse response = new MockHttpServletResponse();
        ResponseEntity<Map<String, String>> result = authController.generateGoogleState(response);
        
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody().get("state"));
        assertNotNull(response.getCookie("oauth_state"));
        assertTrue(response.getCookie("oauth_state").isHttpOnly());
    }

    @Test
    public void testGoogleLoginValidState() {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setState("valid-state");
        request.setCode("auth-code");
        request.setRedirectUri("http://localhost");

        MockHttpServletResponse response = new MockHttpServletResponse();
        
        when(authService.googleLogin(any())).thenReturn(new LoginResponse());
        
        ResponseEntity<LoginResponse> result = authController.googleLogin(request, "valid-state", response);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        
        // Assert cookie is cleared
        assertEquals(0, response.getCookie("oauth_state").getMaxAge());
    }

    @Test
    public void testGoogleLoginInvalidState() {
        GoogleAuthRequest request = new GoogleAuthRequest();
        request.setState("valid-state");

        MockHttpServletResponse response = new MockHttpServletResponse();
        
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            authController.googleLogin(request, "wrong-state", response);
        });
        
        assertTrue(ex.getMessage().contains("OAuth state"));
    }

    @Test
    public void testLoginCookieConfiguration() {
        org.springframework.test.util.ReflectionTestUtils.setField(authController, "cookiesSecure", true);
        org.springframework.test.util.ReflectionTestUtils.setField(authController, "cookiesSameSite", "None");

        com.personalos.backend.dto.LoginRequest request = new com.personalos.backend.dto.LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("password123");

        LoginResponse loginResp = new LoginResponse();
        loginResp.setRefreshToken("sample-refresh-token");
        when(authService.login(any())).thenReturn(loginResp);

        ResponseEntity<LoginResponse> responseEntity = authController.login(request);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());

        String setCookie = responseEntity.getHeaders().getFirst(org.springframework.http.HttpHeaders.SET_COOKIE);
        assertNotNull(setCookie);
        assertTrue(setCookie.contains("refreshToken=sample-refresh-token"));
        assertTrue(setCookie.contains("Secure"));
        assertTrue(setCookie.contains("SameSite=None"));
        assertTrue(setCookie.contains("HttpOnly"));
    }
}
