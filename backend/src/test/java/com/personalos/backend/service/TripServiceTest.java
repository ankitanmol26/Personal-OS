package com.personalos.backend.service;

import com.personalos.backend.dto.TripDTO;
import com.personalos.backend.entity.Trip;
import com.personalos.backend.entity.TripMember;
import com.personalos.backend.entity.User;
import com.personalos.backend.repository.TripMemberRepository;
import com.personalos.backend.repository.TripRepository;
import com.personalos.backend.repository.UserRepository;
import com.personalos.backend.repository.TripContributionRepository;
import com.personalos.backend.repository.SharedExpenseRepository;
import com.personalos.backend.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class TripServiceTest {

    @Mock
    private TripRepository tripRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private TripMemberRepository tripMemberRepository;
    @Mock
    private TripContributionRepository tripContributionRepository;
    @Mock
    private SharedExpenseRepository sharedExpenseRepository;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private TripEventPublisher tripEventPublisher;

    private TripService tripService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        tripService = new TripService(tripRepository, transactionRepository, tripMemberRepository,
                sharedExpenseRepository, tripContributionRepository, currentUserService, tripEventPublisher);
    }

    @Test
    public void testCreateTripWithInviteCode() {
        User user = new User();
        user.setId(1L);
        user.setName("Alice");
        user.setEmail("alice@test.com");

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(tripRepository.save(any(Trip.class))).thenAnswer(invocation -> {
            Trip t = invocation.getArgument(0);
            t.setId(10L);
            return t;
        });

        TripDTO request = new TripDTO();
        request.setName("Goa Vacation");
        request.setDestination("Goa, India");
        request.setCurrency("INR");
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(5));
        request.setBudget(new BigDecimal("50000.00"));

        TripDTO created = tripService.createTrip(request);

        assertNotNull(created);
        assertEquals("Goa Vacation", created.getName());
        assertEquals("Goa, India", created.getDestination());
        assertEquals("INR", created.getCurrency());
        assertNotNull(created.getInviteCode());
        verify(tripMemberRepository).save(any(TripMember.class));
    }

    @Test
    public void testJoinTripByInviteCode() {
        User owner = new User();
        owner.setId(1L);

        Trip trip = new Trip();
        trip.setId(10L);
        trip.setName("Goa Vacation");
        trip.setUser(owner);
        trip.setInviteCode("GOA-INVITE-123");
        trip.setInviteExpiresAt(LocalDateTime.now().plusDays(5));

        User friend = new User();
        friend.setId(2L);
        friend.setName("Bob");
        friend.setEmail("bob@test.com");

        when(tripRepository.findByInviteCode("GOA-INVITE-123")).thenReturn(Optional.of(trip));
        when(currentUserService.getCurrentUser()).thenReturn(friend);
        when(tripMemberRepository.existsByTripIdAndUserId(10L, 2L)).thenReturn(false);

        TripDTO joined = tripService.joinTripByInviteCode("GOA-INVITE-123");

        assertNotNull(joined);
        assertEquals(10L, joined.getId());
        verify(tripMemberRepository).save(any(TripMember.class));
        verify(tripEventPublisher).publishTripUpdate(eq(10L), eq("MEMBER_JOINED"));
    }

    @Test
    public void testJoinTripWithExpiredCodeThrowsException() {
        Trip trip = new Trip();
        trip.setId(10L);
        trip.setInviteCode("EXPIRED-CODE");
        trip.setInviteExpiresAt(LocalDateTime.now().minusDays(1));

        when(tripRepository.findByInviteCode("EXPIRED-CODE")).thenReturn(Optional.of(trip));

        assertThrows(IllegalArgumentException.class, () -> tripService.joinTripByInviteCode("EXPIRED-CODE"));
    }
}
