package com.personalos.backend.controller;

import com.personalos.backend.dto.AddTripMemberRequest;
import com.personalos.backend.dto.TripDTO;
import com.personalos.backend.dto.TripMemberDTO;
import com.personalos.backend.service.TripMembershipService;
import com.personalos.backend.service.TripService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;
    private final TripMembershipService tripMembershipService;

    @Autowired
    public TripController(TripService tripService, TripMembershipService tripMembershipService) {
        this.tripService = tripService;
        this.tripMembershipService = tripMembershipService;
    }

    @GetMapping
    public ResponseEntity<List<TripDTO>> getAllTrips() {
        return ResponseEntity.ok(tripService.getAllTrips());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripDTO> getTripById(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    @PostMapping
    public ResponseEntity<TripDTO> createTrip(@Valid @RequestBody TripDTO tripDTO) {
        TripDTO createdTrip = tripService.createTrip(tripDTO);
        return new ResponseEntity<>(createdTrip, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripDTO> updateTrip(@PathVariable Long id, @Valid @RequestBody TripDTO tripDTO) {
        return ResponseEntity.ok(tripService.updateTrip(id, tripDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<TripMemberDTO>> getTripMembers(@PathVariable Long id) {
        return ResponseEntity.ok(tripMembershipService.getTripMembers(id));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<TripMemberDTO> addTripMember(@PathVariable Long id, @Valid @RequestBody AddTripMemberRequest request) {
        return new ResponseEntity<>(tripMembershipService.addMember(id, request), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeTripMember(@PathVariable Long id, @PathVariable Long userId) {
        tripMembershipService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }
}
