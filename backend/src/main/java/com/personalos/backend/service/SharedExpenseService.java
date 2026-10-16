package com.personalos.backend.service;

import com.personalos.backend.dto.MemberBalanceDTO;
import com.personalos.backend.dto.SharedExpenseDTO;
import com.personalos.backend.dto.SharedExpenseRequest;
import com.personalos.backend.entity.*;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.SharedExpenseRepository;
import com.personalos.backend.repository.TripContributionRepository;
import com.personalos.backend.repository.TripMemberRepository;
import com.personalos.backend.repository.TripRepository;
import com.personalos.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Optional;

@Service
public class SharedExpenseService {

    private final SharedExpenseRepository sharedExpenseRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripContributionRepository tripContributionRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final TripEventPublisher eventPublisher;

    public SharedExpenseService(SharedExpenseRepository sharedExpenseRepository,
                                TripRepository tripRepository,
                                TripMemberRepository tripMemberRepository,
                                TripContributionRepository tripContributionRepository,
                                UserRepository userRepository,
                                CurrentUserService currentUserService,
                                TripEventPublisher eventPublisher) {
        this.sharedExpenseRepository = sharedExpenseRepository;
        this.tripRepository = tripRepository;
        this.tripMemberRepository = tripMemberRepository;
        this.tripContributionRepository = tripContributionRepository;
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

    public List<SharedExpenseDTO> getExpenses(Long tripId) {
        getAccessibleTrip(tripId);
        return sharedExpenseRepository.findByTripIdOrderByDateDescIdDesc(tripId).stream()
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public SharedExpenseDTO createExpense(Long tripId, SharedExpenseRequest request, String idempotencyKey) {
        Trip trip = getAccessibleTrip(tripId);

        if (!isMember(tripId, request.getPayerId())) {
            throw new IllegalArgumentException("Payer must be a member of the trip");
        }

        User payer = userRepository.findById(request.getPayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Payer not found"));
        User creator = currentUserService.getCurrentUser();

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<SharedExpense> existing = sharedExpenseRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                SharedExpense exp = existing.get();
                if (!exp.getCreator().getId().equals(creator.getId())) {
                    throw new IllegalArgumentException("Conflict: Idempotency key does not belong to current user");
                }
                if (exp.getAmount().compareTo(request.getAmount()) != 0
                    || !exp.getDescription().equals(request.getDescription())
                    || !exp.getTrip().getId().equals(tripId)
                    || !exp.getPayer().getId().equals(request.getPayerId())) {
                    throw new IllegalArgumentException("Conflict: Idempotency key reused with different payload");
                }
                return mapToDTO(exp);
            }
        }

        SharedExpense expense = new SharedExpense();
        expense.setTrip(trip);
        expense.setPayer(payer);
        expense.setCreator(creator);
        expense.setDescription(request.getDescription().trim());
        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());
        expense.setCategory(request.getCategory() != null ? request.getCategory() : "Other");
        expense.setNote(request.getNote());
        expense.setIdempotencyKey(idempotencyKey != null && !idempotencyKey.isBlank() ? idempotencyKey : null);

        String splitMethod = request.getSplitMethod() != null ? request.getSplitMethod().toUpperCase() : "EQUAL";
        expense.setSplitMethod(splitMethod);

        BigDecimal total = request.getAmount();

        if ("CUSTOM".equals(splitMethod) && request.getCustomSplits() != null && !request.getCustomSplits().isEmpty()) {
            BigDecimal sumCustom = BigDecimal.ZERO;
            for (SharedExpenseRequest.CustomSplitItem item : request.getCustomSplits()) {
                if (!isMember(tripId, item.getUserId())) {
                    throw new IllegalArgumentException("Participant " + item.getUserId() + " is not a member of the trip");
                }
                if (item.getAmountOwed() == null || item.getAmountOwed().compareTo(BigDecimal.ZERO) < 0) {
                    throw new IllegalArgumentException("Split amount cannot be negative");
                }
                sumCustom = sumCustom.add(item.getAmountOwed());
            }

            if (sumCustom.setScale(2, RoundingMode.HALF_UP).compareTo(total.setScale(2, RoundingMode.HALF_UP)) != 0) {
                throw new IllegalArgumentException("Sum of custom shares (" + sumCustom + ") must equal total expense amount (" + total + ")");
            }

            for (SharedExpenseRequest.CustomSplitItem item : request.getCustomSplits()) {
                User pUser = userRepository.findById(item.getUserId()).orElseThrow();
                SharedExpenseSplit split = new SharedExpenseSplit();
                split.setExpense(expense);
                split.setUser(pUser);
                split.setAmountOwed(item.getAmountOwed().setScale(2, RoundingMode.HALF_UP));
                expense.getSplits().add(split);
            }
        } else {
            // Equal split
            if (request.getParticipantIds() == null || request.getParticipantIds().isEmpty()) {
                throw new IllegalArgumentException("At least one participant is required");
            }

            for (Long pId : request.getParticipantIds()) {
                if (!isMember(tripId, pId)) {
                    throw new IllegalArgumentException("Participant " + pId + " is not a member of the trip");
                }
            }

            int count = request.getParticipantIds().size();
            BigDecimal splitAmount = total.divide(BigDecimal.valueOf(count), 2, RoundingMode.DOWN);
            BigDecimal remainder = total.subtract(splitAmount.multiply(BigDecimal.valueOf(count)));
            int cents = remainder.multiply(BigDecimal.valueOf(100)).intValue();

            for (int i = 0; i < request.getParticipantIds().size(); i++) {
                Long pId = request.getParticipantIds().get(i);
                User pUser = userRepository.findById(pId).orElseThrow();

                BigDecimal amountOwed = splitAmount;
                if (i < cents) {
                    amountOwed = amountOwed.add(new BigDecimal("0.01"));
                }

                SharedExpenseSplit split = new SharedExpenseSplit();
                split.setExpense(expense);
                split.setUser(pUser);
                split.setAmountOwed(amountOwed);
                expense.getSplits().add(split);
            }
        }

        SharedExpense saved = sharedExpenseRepository.save(expense);
        eventPublisher.publishTripUpdate(tripId, "EXPENSE_CREATED");
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteExpense(Long tripId, Long expenseId) {
        getAccessibleTrip(tripId);
        SharedExpense expense = sharedExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        if (!expense.getTrip().getId().equals(tripId)) {
            throw new ResourceNotFoundException("Expense not found");
        }

        Long currentUserId = currentUserService.getCurrentUserId();
        boolean isCreator = expense.getCreator().getId().equals(currentUserId);
        boolean isPayer = expense.getPayer().getId().equals(currentUserId);
        boolean isTripOwner = expense.getTrip().getUser().getId().equals(currentUserId);

        if (!isCreator && !isPayer && !isTripOwner) {
            throw new ResourceNotFoundException("Not authorized to delete this expense");
        }

        sharedExpenseRepository.delete(expense);
        eventPublisher.publishTripUpdate(tripId, "EXPENSE_DELETED");
    }

    public List<MemberBalanceDTO> getBalances(Long tripId) {
        Trip trip = getAccessibleTrip(tripId);

        Map<Long, MemberBalanceDTO> balances = new HashMap<>();

        // Add owner
        MemberBalanceDTO ownerBal = new MemberBalanceDTO();
        ownerBal.setUserId(trip.getUser().getId());
        ownerBal.setName(trip.getUser().getName());
        ownerBal.setEmail(trip.getUser().getEmail());
        ownerBal.setAvatarUrl(trip.getUser().getAvatarUrl());
        ownerBal.setTotalPaid(BigDecimal.ZERO);
        ownerBal.setTotalShareOwed(BigDecimal.ZERO);
        ownerBal.setTotalContributed(BigDecimal.ZERO);
        ownerBal.setNetBalance(BigDecimal.ZERO);
        balances.put(trip.getUser().getId(), ownerBal);

        // Add all trip members
        tripMemberRepository.findByTripId(tripId).forEach(tm -> {
            MemberBalanceDTO bal = new MemberBalanceDTO();
            bal.setUserId(tm.getUser().getId());
            bal.setName(tm.getUser().getName());
            bal.setEmail(tm.getUser().getEmail());
            bal.setAvatarUrl(tm.getUser().getAvatarUrl());
            bal.setTotalPaid(BigDecimal.ZERO);
            bal.setTotalShareOwed(BigDecimal.ZERO);
            bal.setTotalContributed(BigDecimal.ZERO);
            bal.setNetBalance(BigDecimal.ZERO);
            balances.put(tm.getUser().getId(), bal);
        });

        // Add contributions into member balances
        List<TripContribution> contributions = tripContributionRepository.findByTripIdOrderByDateDescIdDesc(tripId);
        for (TripContribution tc : contributions) {
            MemberBalanceDTO contributorBal = balances.get(tc.getUser().getId());
            if (contributorBal != null) {
                contributorBal.setTotalContributed(contributorBal.getTotalContributed().add(tc.getAmount()));
            }
        }

        // Add expenses and splits
        List<SharedExpense> expenses = sharedExpenseRepository.findByTripIdOrderByDateDescIdDesc(tripId);
        for (SharedExpense exp : expenses) {
            MemberBalanceDTO payerBal = balances.get(exp.getPayer().getId());
            if (payerBal != null) {
                payerBal.setTotalPaid(payerBal.getTotalPaid().add(exp.getAmount()));
                payerBal.setNetBalance(payerBal.getNetBalance().add(exp.getAmount()));
            }

            for (SharedExpenseSplit split : exp.getSplits()) {
                MemberBalanceDTO splitUserBal = balances.get(split.getUser().getId());
                if (splitUserBal != null) {
                    splitUserBal.setTotalShareOwed(splitUserBal.getTotalShareOwed().add(split.getAmountOwed()));
                    splitUserBal.setNetBalance(splitUserBal.getNetBalance().subtract(split.getAmountOwed()));
                }
            }
        }

        return balances.values().stream().collect(Collectors.toList());
    }

    private SharedExpenseDTO mapToDTO(SharedExpense expense) {
        SharedExpenseDTO dto = new SharedExpenseDTO();
        dto.setId(expense.getId());
        dto.setTripId(expense.getTrip().getId());
        dto.setDescription(expense.getDescription());
        dto.setAmount(expense.getAmount());
        dto.setPayerId(expense.getPayer().getId());
        dto.setPayerName(expense.getPayer().getName());
        dto.setCreatorId(expense.getCreator().getId());
        dto.setCreatorName(expense.getCreator().getName());
        dto.setDate(expense.getDate());
        dto.setCategory(expense.getCategory());
        dto.setSplitMethod(expense.getSplitMethod());
        dto.setNote(expense.getNote());
        dto.setCreatedAt(expense.getCreatedAt());

        List<SharedExpenseDTO.SplitDTO> splits = expense.getSplits().stream().map(s -> {
            SharedExpenseDTO.SplitDTO sDto = new SharedExpenseDTO.SplitDTO();
            sDto.setUserId(s.getUser().getId());
            sDto.setUserName(s.getUser().getName());
            sDto.setAmountOwed(s.getAmountOwed());
            return sDto;
        }).collect(Collectors.toList());

        dto.setSplits(splits);
        return dto;
    }

    public SharedExpenseDTO getExpenseByIdempotencyKey(String idempotencyKey) {
        return sharedExpenseRepository.findByIdempotencyKey(idempotencyKey)
                .map(this::mapToDTO).orElse(null);
    }
}
