package com.personalos.backend.service;

import com.personalos.backend.dto.TripDTO;
import com.personalos.backend.entity.Trip;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.SharedExpenseRepository;
import com.personalos.backend.repository.TransactionRepository;
import com.personalos.backend.repository.TripMemberRepository;
import com.personalos.backend.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final TransactionRepository transactionRepository;
    private final TripMemberRepository tripMemberRepository;
    private final SharedExpenseRepository sharedExpenseRepository;
    private final CurrentUserService currentUserService;

    @Autowired
    public TripService(TripRepository tripRepository, TransactionRepository transactionRepository, TripMemberRepository tripMemberRepository, SharedExpenseRepository sharedExpenseRepository, CurrentUserService currentUserService) {
        this.tripRepository = tripRepository;
        this.transactionRepository = transactionRepository;
        this.tripMemberRepository = tripMemberRepository;
        this.sharedExpenseRepository = sharedExpenseRepository;
        this.currentUserService = currentUserService;
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

    public TripDTO createTrip(TripDTO dto) {
        validateDates(dto);
        Trip trip = new Trip();
        trip.setName(dto.getName());
        trip.setBudget(dto.getBudget());
        trip.setStartDate(dto.getStartDate());
        trip.setEndDate(dto.getEndDate());
        trip.setCreatedAt(LocalDateTime.now());
        trip.setUser(currentUserService.getCurrentUser()); // Isolated temporary mechanism for Stage 5A

        Trip savedTrip = tripRepository.save(trip);
        return mapToDTO(savedTrip);
    }

    public TripDTO updateTrip(Long id, TripDTO dto) {
        validateDates(dto);
        Trip trip = tripRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        trip.setName(dto.getName());
        trip.setBudget(dto.getBudget());
        trip.setStartDate(dto.getStartDate());
        trip.setEndDate(dto.getEndDate());

        Trip updatedTrip = tripRepository.save(trip);
        return mapToDTO(updatedTrip);
    }

    @Transactional
    public void deleteTrip(Long id) {
        Trip trip = tripRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
        
        transactionRepository.detachTransactionsFromTrip(id);
        tripMemberRepository.deleteByTripId(id);
        sharedExpenseRepository.deleteByTripId(id);
        tripRepository.delete(trip);
    }

    private void validateDates(TripDTO dto) {
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }
    }

    private TripDTO mapToDTO(Trip trip) {
        TripDTO dto = new TripDTO();
        dto.setId(trip.getId());
        dto.setName(trip.getName());
        dto.setBudget(trip.getBudget());
        dto.setStartDate(trip.getStartDate());
        dto.setEndDate(trip.getEndDate());

        BigDecimal spent = transactionRepository.calculateTripExpenses(trip.getId(), currentUserService.getCurrentUserId());
        if (spent == null) {
            spent = BigDecimal.ZERO;
        }
        
        dto.setSpent(spent);
        dto.setRemaining(trip.getBudget().subtract(spent));
        
        return dto;
    }
}
