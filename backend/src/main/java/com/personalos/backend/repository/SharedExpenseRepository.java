package com.personalos.backend.repository;

import com.personalos.backend.entity.SharedExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SharedExpenseRepository extends JpaRepository<SharedExpense, Long> {
    List<SharedExpense> findByTripIdOrderByDateDescIdDesc(Long tripId);
    
    Optional<SharedExpense> findByIdempotencyKey(String idempotencyKey);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM SharedExpense se WHERE se.trip.id = :tripId")
    void deleteByTripId(@org.springframework.data.repository.query.Param("tripId") Long tripId);
}
