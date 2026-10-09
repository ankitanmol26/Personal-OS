package com.personalos.backend.repository;

import com.personalos.backend.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserId(Long userId);
    Optional<Trip> findByIdAndUserId(Long id, Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT t FROM Trip t LEFT JOIN TripMember tm ON t.id = tm.trip.id WHERE t.user.id = :userId OR tm.user.id = :userId")
    List<Trip> findAccessibleTrips(@org.springframework.data.repository.query.Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT t FROM Trip t LEFT JOIN TripMember tm ON t.id = tm.trip.id WHERE t.id = :id AND (t.user.id = :userId OR tm.user.id = :userId)")
    Optional<Trip> findAccessibleTripById(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("userId") Long userId);
}
