package com.personalos.backend.service;

import com.personalos.backend.dto.TripContributionDTO;
import com.personalos.backend.entity.Trip;
import com.personalos.backend.entity.TripContribution;
import com.personalos.backend.entity.User;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.TripContributionRepository;
import com.personalos.backend.repository.TripMemberRepository;
import com.personalos.backend.repository.TripRepository;
import com.personalos.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TripContributionService {

    private final TripContributionRepository tripContributionRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final TripEventPublisher eventPublisher;

    public TripContributionService(TripContributionRepository tripContributionRepository,
                                   TripRepository tripRepository,
                                   TripMemberRepository tripMemberRepository,
                                   UserRepository userRepository,
                                   CurrentUserService currentUserService,
                                   TripEventPublisher eventPublisher) {
        this.tripContributionRepository = tripContributionRepository;
        this.tripRepository = tripRepository;
        this.tripMemberRepository = tripMemberRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.eventPublisher = eventPublisher;
    }

    private Trip getAccessibleTrip(Long tripId) {
        return tripRepository.findAccessibleTripById(tripId, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found"));
    }

    private boolean isMember(Long tripId, Long userId) {
        Trip trip = tripRepository.findById(tripId).orElse(null);
        if (trip == null) return false;
        if (trip.getUser().getId().equals(userId)) return true;
        return tripMemberRepository.existsByTripIdAndUserId(tripId, userId);
    }

    public List<TripContributionDTO> getContributions(Long tripId) {
        getAccessibleTrip(tripId);
        return tripContributionRepository.findByTripIdOrderByDateDescIdDesc(tripId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TripContributionDTO addContribution(Long tripId, TripContributionDTO dto) {
        Trip trip = getAccessibleTrip(tripId);
        Long currentUserId = currentUserService.getCurrentUserId();

        Long contributorId = dto.getUserId() != null ? dto.getUserId() : currentUserId;
        if (!isMember(tripId, contributorId)) {
            throw new IllegalArgumentException("User is not a member of this trip");
        }

        User user = userRepository.findById(contributorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TripContribution contribution = new TripContribution();
        contribution.setTrip(trip);
        contribution.setUser(user);
        contribution.setAmount(dto.getAmount());
        contribution.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : trip.getCurrency());
        contribution.setDate(dto.getDate());
        contribution.setNote(dto.getNote());
        contribution.setCreatedAt(LocalDateTime.now());

        TripContribution saved = tripContributionRepository.save(contribution);
        eventPublisher.publishTripUpdate(tripId, "CONTRIBUTION_ADDED");
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteContribution(Long tripId, Long contributionId) {
        getAccessibleTrip(tripId);
        TripContribution contribution = tripContributionRepository.findById(contributionId)
                .orElseThrow(() -> new ResourceNotFoundException("Contribution not found"));

        if (!contribution.getTrip().getId().equals(tripId)) {
            throw new ResourceNotFoundException("Contribution not found in this trip");
        }

        Long currentUserId = currentUserService.getCurrentUserId();
        boolean isCreator = contribution.getUser().getId().equals(currentUserId);
        boolean isTripOwner = contribution.getTrip().getUser().getId().equals(currentUserId);

        if (!isCreator && !isTripOwner) {
            throw new ResourceNotFoundException("Not authorized to delete this contribution");
        }

        tripContributionRepository.delete(contribution);
        eventPublisher.publishTripUpdate(tripId, "CONTRIBUTION_DELETED");
    }

    private TripContributionDTO mapToDTO(TripContribution tc) {
        TripContributionDTO dto = new TripContributionDTO();
        dto.setId(tc.getId());
        dto.setTripId(tc.getTrip().getId());
        dto.setUserId(tc.getUser().getId());
        dto.setUserName(tc.getUser().getName());
        dto.setUserEmail(tc.getUser().getEmail());
        dto.setUserAvatarUrl(tc.getUser().getAvatarUrl());
        dto.setAmount(tc.getAmount());
        dto.setCurrency(tc.getCurrency());
        dto.setDate(tc.getDate());
        dto.setNote(tc.getNote());
        dto.setCreatedAt(tc.getCreatedAt());
        return dto;
    }
}
