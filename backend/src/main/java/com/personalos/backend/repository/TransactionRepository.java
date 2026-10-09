package com.personalos.backend.repository;

import com.personalos.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.trip.id = :tripId AND t.user.id = :userId AND t.type = 'EXPENSE'")
    BigDecimal calculateTripExpenses(@Param("tripId") Long tripId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Transaction t SET t.trip = null WHERE t.trip.id = :tripId")
    void detachTransactionsFromTrip(@Param("tripId") Long tripId);

    List<Transaction> findByUserId(Long userId);
    Optional<Transaction> findByIdAndUserId(Long id, Long userId);
}
