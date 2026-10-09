package com.personalos.backend.service;

import com.personalos.backend.dto.TransactionDTO;
import com.personalos.backend.entity.Transaction;
import com.personalos.backend.entity.Trip;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.TransactionRepository;
import com.personalos.backend.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final TripRepository tripRepository;
    private final CurrentUserService currentUserService;

    @Autowired
    public TransactionService(TransactionRepository transactionRepository, TripRepository tripRepository, CurrentUserService currentUserService) {
        this.transactionRepository = transactionRepository;
        this.tripRepository = tripRepository;
        this.currentUserService = currentUserService;
    }

    public List<TransactionDTO> getAllTransactions() {
        return transactionRepository.findByUserId(currentUserService.getCurrentUserId()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public TransactionDTO getTransactionById(Long id) {
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        return mapToDTO(transaction);
    }

    public TransactionDTO createTransaction(TransactionDTO dto) {
        Transaction transaction = new Transaction();
        transaction.setType(dto.getType());
        transaction.setAmount(dto.getAmount());
        transaction.setCategory(dto.getCategory());
        transaction.setDescription(dto.getDescription());
        transaction.setPaymentMethod(dto.getPaymentMethod());
        transaction.setDate(dto.getDate());
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setUser(currentUserService.getCurrentUser()); // Isolated temporary mechanism for Stage 5A
        
        if (dto.getTripId() != null) {
            Trip trip = tripRepository.findAccessibleTripById(dto.getTripId(), currentUserService.getCurrentUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + dto.getTripId()));
            transaction.setTrip(trip);
        }

        Transaction savedTransaction = transactionRepository.save(transaction);
        return mapToDTO(savedTransaction);
    }

    public TransactionDTO updateTransaction(Long id, TransactionDTO dto) {
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        transaction.setType(dto.getType());
        transaction.setAmount(dto.getAmount());
        transaction.setCategory(dto.getCategory());
        transaction.setDescription(dto.getDescription());
        transaction.setPaymentMethod(dto.getPaymentMethod());
        transaction.setDate(dto.getDate());
        
        if (dto.getTripId() != null) {
            Trip trip = tripRepository.findAccessibleTripById(dto.getTripId(), currentUserService.getCurrentUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + dto.getTripId()));
            transaction.setTrip(trip);
        } else {
            transaction.setTrip(null);
        }

        Transaction updatedTransaction = transactionRepository.save(transaction);
        return mapToDTO(updatedTransaction);
    }

    public void deleteTransaction(Long id) {
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
        transactionRepository.delete(transaction);
    }

    private TransactionDTO mapToDTO(Transaction transaction) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(transaction.getId());
        dto.setType(transaction.getType());
        dto.setAmount(transaction.getAmount());
        dto.setCategory(transaction.getCategory());
        dto.setDescription(transaction.getDescription());
        dto.setPaymentMethod(transaction.getPaymentMethod());
        dto.setDate(transaction.getDate());
        dto.setCreatedAt(transaction.getCreatedAt());
        if (transaction.getTrip() != null) {
            dto.setTripId(transaction.getTrip().getId());
        }
        return dto;
    }
}
