package com.personalos.backend.service;

import com.personalos.backend.dto.TripDTO;
import com.personalos.backend.entity.Trip;
import com.personalos.backend.entity.TripMember;
import com.personalos.backend.entity.TripRole;
import com.personalos.backend.entity.User;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.SharedExpenseRepository;
import com.personalos.backend.repository.TransactionRepository;
import com.personalos.backend.repository.TripContributionRepository;
import com.personalos.backend.repository.TripMemberRepository;
import com.personalos.backend.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final TransactionRepository transactionRepository;
    private final TripMemberRepository tripMemberRepository;
    private final SharedExpenseRepository sharedExpenseRepository;
    private final TripContributionRepository tripContributionRepository;
    private final CurrentUserService currentUserService;
    private final TripEventPublisher eventPublisher;

    @Autowired
    public TripService(TripRepository tripRepository,
                       TransactionRepository transactionRepository,
                       TripMemberRepository tripMemberRepository,
                       SharedExpenseRepository sharedExpenseRepository,
                       TripContributionRepository tripContributionRepository,
                       CurrentUserService currentUserService,
                       TripEventPublisher eventPublisher) {
        this.tripRepository = tripRepository;
        this.transactionRepository = transactionRepository;
        this.tripMemberRepository = tripMemberRepository;
        this.sharedExpenseRepository = sharedExpenseRepository;
        this.tripContributionRepository = tripContributionRepository;
        this.currentUserService = currentUserService;
        this.eventPublisher = eventPublisher;
    }

    public List<TripDTO> getAllTrips() {
        return tripRepository.findAccessibleTrips(currentUserService.getCurrentUserId()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public TripDTO getTripById(Long id) {
        Trip trip = tripRepository.findAccessibleTripById(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
        return mapToDTO(trip);
    }

    public TripDTO getTripByInviteCode(String inviteCode) {
        Trip trip = tripRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with invite code: " + inviteCode));
        return mapToDTO(trip);
    }

    @Transactional
    public TripDTO createTrip(TripDTO dto) {
        validateDates(dto);
        Trip trip = new Trip();
        trip.setName(dto.getName());
        trip.setBudget(dto.getBudget());
        trip.setStartDate(dto.getStartDate());
        trip.setEndDate(dto.getEndDate());
        trip.setDestination(dto.getDestination());
        trip.setCurrency(dto.getCurrency() != null && !dto.getCurrency().isBlank() ? dto.getCurrency() : "INR");
        trip.setInviteCode("TRIP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        trip.setCreatedAt(LocalDateTime.now());

        User creator = currentUserService.getCurrentUser();
        trip.setUser(creator);

        Trip savedTrip = tripRepository.save(trip);

        // Automatically add creator to trip_members as OWNER
        if (!tripMemberRepository.existsByTripIdAndUserId(savedTrip.getId(), creator.getId())) {
            TripMember member = new TripMember();
            member.setTrip(savedTrip);
            member.setUser(creator);
            member.setRole(TripRole.OWNER);
            member.setJoinedAt(LocalDateTime.now());
            tripMemberRepository.save(member);
        }

        return mapToDTO(savedTrip);
    }

    @Transactional
    public TripDTO updateTrip(Long id, TripDTO dto) {
        validateDates(dto);
        Trip trip = tripRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        trip.setName(dto.getName());
        trip.setBudget(dto.getBudget());
        trip.setStartDate(dto.getStartDate());
        trip.setEndDate(dto.getEndDate());
        if (dto.getDestination() != null) {
            trip.setDestination(dto.getDestination());
        }
        if (dto.getCurrency() != null && !dto.getCurrency().isBlank()) {
            trip.setCurrency(dto.getCurrency());
        }

        Trip updatedTrip = tripRepository.save(trip);
        eventPublisher.publishTripUpdate(id, "TRIP_UPDATED");
        return mapToDTO(updatedTrip);
    }

    @Transactional
    public TripDTO regenerateInviteCode(Long id) {
        Trip trip = tripRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found or user is not the owner"));

        trip.setInviteCode("TRIP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        Trip updated = tripRepository.save(trip);
        eventPublisher.publishTripUpdate(id, "INVITE_CODE_REGENERATED");
        return mapToDTO(updated);
    }

    @Transactional
    public TripDTO joinTripByInviteCode(String inviteCode) {
        Trip trip = tripRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired invite code"));

        if (trip.getInviteExpiresAt() != null && trip.getInviteExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This invitation link has expired");
        }

        User currentUser = currentUserService.getCurrentUser();

        // If user is owner or already a member, return the trip
        if (trip.getUser().getId().equals(currentUser.getId()) ||
            tripMemberRepository.existsByTripIdAndUserId(trip.getId(), currentUser.getId())) {
            return mapToDTO(trip);
        }

        TripMember newMember = new TripMember();
        newMember.setTrip(trip);
        newMember.setUser(currentUser);
        newMember.setRole(TripRole.MEMBER);
        newMember.setJoinedAt(LocalDateTime.now());
        tripMemberRepository.save(newMember);

        eventPublisher.publishTripUpdate(trip.getId(), "MEMBER_JOINED");
        return mapToDTO(trip);
    }

    @Transactional
    public void deleteTrip(Long id) {
        Trip trip = tripRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        transactionRepository.detachTransactionsFromTrip(id);
        tripContributionRepository.deleteByTripId(id);
        sharedExpenseRepository.deleteByTripId(id);
        tripMemberRepository.deleteByTripId(id);
        tripRepository.delete(trip);
        eventPublisher.publishTripUpdate(id, "TRIP_DELETED");
    }

    private void validateDates(TripDTO dto) {
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }
    }

    public TripDTO mapToDTO(Trip trip) {
        TripDTO dto = new TripDTO();
        dto.setId(trip.getId());
        dto.setName(trip.getName());
        dto.setBudget(trip.getBudget());
        dto.setStartDate(trip.getStartDate());
        dto.setEndDate(trip.getEndDate());
        dto.setDestination(trip.getDestination());
        dto.setCurrency(trip.getCurrency() != null ? trip.getCurrency() : "INR");
        dto.setInviteCode(trip.getInviteCode());
        dto.setCreatedAt(trip.getCreatedAt());

        if (trip.getUser() != null) {
            dto.setUserId(trip.getUser().getId());
            dto.setOwnerName(trip.getUser().getName());
        }

        // Shared expenses sum
        BigDecimal sharedSpent = sharedExpenseRepository.sumAmountByTripId(trip.getId());
        // Personal transactions assigned to trip
        Long currentUserId = currentUserService.getCurrentUserIdOrNull();
        BigDecimal personalSpent = currentUserId != null
                ? transactionRepository.calculateTripExpenses(trip.getId(), currentUserId)
                : BigDecimal.ZERO;
        if (personalSpent == null) personalSpent = BigDecimal.ZERO;
        if (sharedSpent == null) sharedSpent = BigDecimal.ZERO;

        BigDecimal totalSpent = sharedSpent.add(personalSpent);
        dto.setSpent(totalSpent);
        BigDecimal budget = trip.getBudget() != null ? trip.getBudget() : BigDecimal.ZERO;
        dto.setRemaining(budget.subtract(totalSpent));

        BigDecimal totalContributed = tripContributionRepository.sumAmountByTripId(trip.getId());
        dto.setTotalContributed(totalContributed != null ? totalContributed : BigDecimal.ZERO);

        return dto;
    }
}
