package com.personalos.backend.service;

import com.personalos.backend.entity.User;
import com.personalos.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    private CustomUserDetailsService userDetailsService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        userDetailsService = new CustomUserDetailsService(userRepository);
    }

    @Test
    public void testLoadUserWithPassword() {
        User user = new User();
        user.setEmail("user@example.com");
        user.setPassword("hashed-password");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        UserDetails details = userDetailsService.loadUserByUsername("user@example.com");
        assertNotNull(details);
        assertEquals("user@example.com", details.getUsername());
        assertEquals("hashed-password", details.getPassword());
    }

    @Test
    public void testLoadGoogleUserWithNullPasswordReturnsUserDetailsWithEmptyPassword() {
        User user = new User();
        user.setEmail("google@example.com");
        user.setPassword(null);
        when(userRepository.findByEmail("google@example.com")).thenReturn(Optional.of(user));

        UserDetails details = userDetailsService.loadUserByUsername("google@example.com");
        assertNotNull(details);
        assertEquals("google@example.com", details.getUsername());
        assertEquals("", details.getPassword());
    }

    @Test
    public void testLoadNonExistentUserThrowsUsernameNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername("unknown@example.com");
        });
    }
}
