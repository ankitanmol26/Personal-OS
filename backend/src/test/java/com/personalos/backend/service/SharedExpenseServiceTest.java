package com.personalos.backend.service;

import com.personalos.backend.dto.MemberBalanceDTO;
import com.personalos.backend.dto.SharedExpenseDTO;
import com.personalos.backend.dto.SharedExpenseRequest;
import com.personalos.backend.entity.*;
import com.personalos.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class SharedExpenseServiceTest {

    @Mock
    private SharedExpenseRepository sharedExpenseRepository;
    @Mock
    private TripRepository tripRepository;
    @Mock
    private TripMemberRepository tripMemberRepository;
    @Mock
    private TripContributionRepository tripContributionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private TripEventPublisher eventPublisher;

    private SharedExpenseService sharedExpenseService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        sharedExpenseService = new SharedExpenseService(
                sharedExpenseRepository,
                tripRepository,
                tripMemberRepository,
                tripContributionRepository,
                userRepository,
                currentUserService,
                eventPublisher
        );
    }

    @Test
    public void testCreateEqualSplitExpense() {
        Long tripId = 1L;
        Long currentUserId = 10L;
        when(currentUserService.getCurrentUserId()).thenReturn(currentUserId);

        User user1 = new User();
        user1.setId(10L);
        user1.setName("User 10");
        when(currentUserService.getCurrentUser()).thenReturn(user1);

        User user2 = new User();
        user2.setId(20L);
        user2.setName("User 20");

        Trip trip = new Trip();
        trip.setId(tripId);
        trip.setUser(user1);

        when(tripRepository.findAccessibleTripById(tripId, currentUserId)).thenReturn(Optional.of(trip));
        when(tripRepository.findById(tripId)).thenReturn(Optional.of(trip));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(20L)).thenReturn(Optional.of(user2));
        when(tripMemberRepository.existsByTripIdAndUserId(tripId, 20L)).thenReturn(true);

        when(sharedExpenseRepository.save(any(SharedExpense.class))).thenAnswer(inv -> {
            SharedExpense exp = inv.getArgument(0);
            exp.setId(99L);
            return exp;
        });

        SharedExpenseRequest request = new SharedExpenseRequest();
        request.setDescription("Dinner");
        request.setAmount(new BigDecimal("100.00"));
        request.setDate(LocalDate.now());
        request.setPayerId(10L);
        request.setParticipantIds(List.of(10L, 20L));
        request.setSplitMethod("EQUAL");

        SharedExpenseDTO result = sharedExpenseService.createExpense(tripId, request, null);

        assertNotNull(result);
        assertEquals("Dinner", result.getDescription());
        assertEquals(new BigDecimal("100.00"), result.getAmount());
        assertEquals(2, result.getSplits().size());
        assertEquals(new BigDecimal("50.00"), result.getSplits().get(0).getAmountOwed());
        assertEquals(new BigDecimal("50.00"), result.getSplits().get(1).getAmountOwed());
        verify(eventPublisher).publishTripUpdate(eq(tripId), eq("EXPENSE_CREATED"));
    }

    @Test
    public void testCustomSplitValidationFailsWhenTotalDoesNotMatch() {
        Long tripId = 1L;
        Long currentUserId = 10L;
        when(currentUserService.getCurrentUserId()).thenReturn(currentUserId);

        User user1 = new User();
        user1.setId(10L);
        Trip trip = new Trip();
        trip.setId(tripId);
        trip.setUser(user1);

        when(currentUserService.getCurrentUser()).thenReturn(user1);
        when(tripRepository.findAccessibleTripById(tripId, currentUserId)).thenReturn(Optional.of(trip));
        when(tripRepository.findById(tripId)).thenReturn(Optional.of(trip));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user1));

        SharedExpenseRequest request = new SharedExpenseRequest();
        request.setDescription("Custom split");
        request.setAmount(new BigDecimal("100.00"));
        request.setDate(LocalDate.now());
        request.setPayerId(10L);
        request.setSplitMethod("CUSTOM");

        SharedExpenseRequest.CustomSplitItem item = new SharedExpenseRequest.CustomSplitItem();
        item.setUserId(10L);
        item.setAmountOwed(new BigDecimal("80.00")); // Sum is 80, not 100
        request.setCustomSplits(List.of(item));

        assertThrows(IllegalArgumentException.class, () -> sharedExpenseService.createExpense(tripId, request, null));
    }
}
