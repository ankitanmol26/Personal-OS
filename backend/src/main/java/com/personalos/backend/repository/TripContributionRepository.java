package com.personalos.backend.repository;

import com.personalos.backend.entity.TripContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripContributionRepository extends JpaRepository<TripContribution, Long> {
    List<TripContribution> findByTripIdOrderByDateDescIdDesc(Long tripId);
    List<TripContribution> findByTripIdAndUserId(Long tripId, Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(tc.amount), 0) FROM TripContribution tc WHERE tc.trip.id = :tripId")
    java.math.BigDecimal sumAmountByTripId(@org.springframework.data.repository.query.Param("tripId") Long tripId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(tc.amount), 0) FROM TripContribution tc WHERE tc.trip.id = :tripId AND tc.user.id = :userId")
    java.math.BigDecimal sumAmountByTripIdAndUserId(@org.springframework.data.repository.query.Param("tripId") Long tripId, @org.springframework.data.repository.query.Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM TripContribution tc WHERE tc.trip.id = :tripId")
    void deleteByTripId(@org.springframework.data.repository.query.Param("tripId") Long tripId);
}
