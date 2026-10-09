package com.personalos.backend.controller;

import com.personalos.backend.dto.MemberBalanceDTO;
import com.personalos.backend.dto.SharedExpenseDTO;
import com.personalos.backend.dto.SharedExpenseRequest;
import com.personalos.backend.service.SharedExpenseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/shared-expenses")
public class SharedExpenseController {

    private final SharedExpenseService sharedExpenseService;

    @Autowired
    public SharedExpenseController(SharedExpenseService sharedExpenseService) {
        this.sharedExpenseService = sharedExpenseService;
    }

    @GetMapping
    public ResponseEntity<List<SharedExpenseDTO>> getExpenses(@PathVariable Long tripId) {
        return ResponseEntity.ok(sharedExpenseService.getExpenses(tripId));
    }

    @PostMapping
    public ResponseEntity<SharedExpenseDTO> createExpense(@PathVariable Long tripId, @Valid @RequestBody SharedExpenseRequest request) {
        return new ResponseEntity<>(sharedExpenseService.createExpense(tripId, request), HttpStatus.CREATED);
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long tripId, @PathVariable Long expenseId) {
        sharedExpenseService.deleteExpense(tripId, expenseId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/balances")
    public ResponseEntity<List<MemberBalanceDTO>> getBalances(@PathVariable Long tripId) {
        return ResponseEntity.ok(sharedExpenseService.getBalances(tripId));
    }
}
