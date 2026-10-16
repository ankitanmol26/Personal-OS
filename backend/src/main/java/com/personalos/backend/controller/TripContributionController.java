package com.personalos.backend.controller;

import com.personalos.backend.dto.TripContributionDTO;
import com.personalos.backend.service.TripContributionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/contributions")
public class TripContributionController {

    private final TripContributionService tripContributionService;

    @Autowired
    public TripContributionController(TripContributionService tripContributionService) {
        this.tripContributionService = tripContributionService;
    }

    @GetMapping
    public ResponseEntity<List<TripContributionDTO>> getContributions(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripContributionService.getContributions(tripId));
    }

    @PostMapping
    public ResponseEntity<TripContributionDTO> addContribution(
            @PathVariable Long tripId,
            @Valid @RequestBody TripContributionDTO dto) {
        return new ResponseEntity<>(tripContributionService.addContribution(tripId, dto), HttpStatus.CREATED);
    }

    @DeleteMapping("/{contributionId}")
    public ResponseEntity<Void> deleteContribution(
            @PathVariable Long tripId,
            @PathVariable Long contributionId) {
        tripContributionService.deleteContribution(tripId, contributionId);
        return ResponseEntity.noContent().build();
    }
}
