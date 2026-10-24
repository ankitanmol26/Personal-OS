package com.personalos.backend.repository;

import com.personalos.backend.entity.SharedExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SharedExpenseRepository extends JpaRepository<SharedExpense, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"payer", "creator", "splits", "splits.user"})
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT se FROM SharedExpense se WHERE se.trip.id = :tripId ORDER BY se.date DESC, se.id DESC")
    List<SharedExpense> findByTripIdOrderByDateDescIdDesc(@org.springframework.data.repository.query.Param("tripId") Long tripId);

    Optional<SharedExpense> findByIdempotencyKey(String idempotencyKey);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM SharedExpense se WHERE se.trip.id = :tripId")
    void deleteByTripId(@org.springframework.data.repository.query.Param("tripId") Long tripId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(se.amount), 0) FROM SharedExpense se WHERE se.trip.id = :tripId")
    java.math.BigDecimal sumAmountByTripId(@org.springframework.data.repository.query.Param("tripId") Long tripId);
}
