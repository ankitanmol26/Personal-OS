package com.personalos.backend.service;

import com.personalos.backend.dto.AddTripMemberRequest;
import com.personalos.backend.dto.TripMemberDTO;
import com.personalos.backend.entity.Trip;
import com.personalos.backend.entity.TripMember;
import com.personalos.backend.entity.TripRole;
import com.personalos.backend.entity.User;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.TripMemberRepository;
import com.personalos.backend.repository.TripRepository;
import com.personalos.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TripMembershipService {

    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public TripMembershipService(TripRepository tripRepository, TripMemberRepository tripMemberRepository, UserRepository userRepository, CurrentUserService currentUserService) {
        this.tripRepository = tripRepository;
        this.tripMemberRepository = tripMemberRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    private Trip getAccessibleTrip(Long tripId) {
        return tripRepository.findAccessibleTripById(tripId, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found"));
    }

    private void verifyOwnership(Trip trip) {
        if (!trip.getUser().getId().equals(currentUserService.getCurrentUserId())) {
            throw new ResourceNotFoundException("Trip not found");
        }
    }

    public List<TripMemberDTO> getTripMembers(Long tripId) {
        Trip trip = getAccessibleTrip(tripId);
        
        List<TripMemberDTO> members = tripMemberRepository.findByTripId(trip.getId()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        TripMemberDTO ownerDto = new TripMemberDTO();
        ownerDto.setId(0L); 
        ownerDto.setTripId(trip.getId());
        ownerDto.setUserId(trip.getUser().getId());
        ownerDto.setName(trip.getUser().getName());
        ownerDto.setEmail(trip.getUser().getEmail());
        ownerDto.setAvatarUrl(trip.getUser().getAvatarUrl());
        ownerDto.setRole(TripRole.OWNER.name());
        ownerDto.setJoinedAt(trip.getCreatedAt());

        members.add(0, ownerDto);
        return members;
    }

    public TripMemberDTO addMember(Long tripId, AddTripMemberRequest request) {
        Trip trip = getAccessibleTrip(tripId);
        verifyOwnership(trip);

        User memberToAdd = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + request.getEmail()));

        if (trip.getUser().getId().equals(memberToAdd.getId())) {
            throw new IllegalArgumentException("Owner cannot be added as a member");
        }

        if (tripMemberRepository.existsByTripIdAndUserId(trip.getId(), memberToAdd.getId())) {
            throw new IllegalArgumentException("User is already a member of this trip");
        }

        TripMember tm = new TripMember();
        tm.setTrip(trip);
        tm.setUser(memberToAdd);
        tm.setRole(TripRole.MEMBER);
        tm.setJoinedAt(LocalDateTime.now());

        return mapToDTO(tripMemberRepository.save(tm));
    }

    public void removeMember(Long tripId, Long memberUserId) {
        Trip trip = getAccessibleTrip(tripId);
        verifyOwnership(trip);

        if (trip.getUser().getId().equals(memberUserId)) {
            throw new IllegalArgumentException("Owner cannot be removed");
        }

        TripMember tm = tripMemberRepository.findByTripIdAndUserId(trip.getId(), memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        tripMemberRepository.delete(tm);
    }

    private TripMemberDTO mapToDTO(TripMember tm) {
        TripMemberDTO dto = new TripMemberDTO();
        dto.setId(tm.getId());
        dto.setTripId(tm.getTrip().getId());
        dto.setUserId(tm.getUser().getId());
        dto.setName(tm.getUser().getName());
        dto.setEmail(tm.getUser().getEmail());
        dto.setAvatarUrl(tm.getUser().getAvatarUrl());
        dto.setRole(tm.getRole().name());
        dto.setJoinedAt(tm.getJoinedAt());
        return dto;
    }
}
