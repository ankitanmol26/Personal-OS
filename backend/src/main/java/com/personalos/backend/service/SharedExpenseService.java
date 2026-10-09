package com.personalos.backend.service;

import com.personalos.backend.dto.MemberBalanceDTO;
import com.personalos.backend.dto.SharedExpenseDTO;
import com.personalos.backend.dto.SharedExpenseRequest;
import com.personalos.backend.entity.*;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.SharedExpenseRepository;
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

@Service
public class SharedExpenseService {

    private final SharedExpenseRepository sharedExpenseRepository;
    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public SharedExpenseService(SharedExpenseRepository sharedExpenseRepository, TripRepository tripRepository, TripMemberRepository tripMemberRepository, UserRepository userRepository, CurrentUserService currentUserService) {
        this.sharedExpenseRepository = sharedExpenseRepository;
        this.tripRepository = tripRepository;
        this.tripMemberRepository = tripMemberRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
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
    public SharedExpenseDTO createExpense(Long tripId, SharedExpenseRequest request) {
        Trip trip = getAccessibleTrip(tripId);
        
        if (!isMember(tripId, request.getPayerId())) {
            throw new IllegalArgumentException("Payer must be a member of the trip");
        }

        if (request.getParticipantIds() == null || request.getParticipantIds().isEmpty()) {
            throw new IllegalArgumentException("At least one participant is required");
        }

        for (Long pId : request.getParticipantIds()) {
            if (!isMember(tripId, pId)) {
                throw new IllegalArgumentException("Participant " + pId + " is not a member of the trip");
            }
        }

        User payer = userRepository.findById(request.getPayerId()).orElseThrow();
        User creator = currentUserService.getCurrentUser();

        SharedExpense expense = new SharedExpense();
        expense.setTrip(trip);
        expense.setPayer(payer);
        expense.setCreator(creator);
        expense.setDescription(request.getDescription());
        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate());

        BigDecimal total = request.getAmount();
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

        SharedExpense saved = sharedExpenseRepository.save(expense);
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
        if (!expense.getCreator().getId().equals(currentUserId) && !expense.getTrip().getUser().getId().equals(currentUserId)) {
            throw new ResourceNotFoundException("Expense not found"); 
        }
        
        sharedExpenseRepository.delete(expense);
    }

    public List<MemberBalanceDTO> getBalances(Long tripId) {
        Trip trip = getAccessibleTrip(tripId);
        
        Map<Long, MemberBalanceDTO> balances = new HashMap<>();
        
        MemberBalanceDTO ownerBal = new MemberBalanceDTO();
        ownerBal.setUserId(trip.getUser().getId());
        ownerBal.setName(trip.getUser().getName());
        ownerBal.setTotalPaid(BigDecimal.ZERO);
        ownerBal.setTotalShareOwed(BigDecimal.ZERO);
        ownerBal.setNetBalance(BigDecimal.ZERO);
        balances.put(trip.getUser().getId(), ownerBal);
        
        tripMemberRepository.findByTripId(tripId).forEach(tm -> {
            MemberBalanceDTO bal = new MemberBalanceDTO();
            bal.setUserId(tm.getUser().getId());
            bal.setName(tm.getUser().getName());
            bal.setTotalPaid(BigDecimal.ZERO);
            bal.setTotalShareOwed(BigDecimal.ZERO);
            bal.setNetBalance(BigDecimal.ZERO);
            balances.put(tm.getUser().getId(), bal);
        });

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
}
