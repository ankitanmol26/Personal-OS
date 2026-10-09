package com.personalos.backend.service;

import com.personalos.backend.dto.PasswordChangeRequest;
import com.personalos.backend.dto.ProfileUpdateRequest;
import com.personalos.backend.dto.UserDTO;
import com.personalos.backend.entity.User;
import com.personalos.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileService(CurrentUserService currentUserService, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserDTO getMyProfile() {
        User user = currentUserService.getCurrentUser();
        return mapToDTO(user);
    }

    @Transactional
    public UserDTO updateProfile(ProfileUpdateRequest request) {
        User user = currentUserService.getCurrentUser();
        
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName().trim());
        } else {
            throw new IllegalArgumentException("Name cannot be blank");
        }
        
        if (request.getAvatarUrl() != null && request.getAvatarUrl().trim().isEmpty()) {
            user.setAvatarUrl(null);
        } else {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        User saved = userRepository.save(user);
        return mapToDTO(saved);
    }

    @Transactional
    public void changePassword(PasswordChangeRequest request) {
        User user = currentUserService.getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Incorrect current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserDTO mapToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }
}
