package com.personalos.backend.service;

import com.personalos.backend.entity.DsaProblem;
import com.personalos.backend.repository.DsaProblemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DsaProblemService {

    private final DsaProblemRepository dsaProblemRepository;
    private final CurrentUserService currentUserService;

    public DsaProblemService(DsaProblemRepository dsaProblemRepository, CurrentUserService currentUserService) {
        this.dsaProblemRepository = dsaProblemRepository;
        this.currentUserService = currentUserService;
    }

    public List<DsaProblem> getAllProblems() {
        return dsaProblemRepository.findByUserId(currentUserService.getCurrentUserId());
    }

    public DsaProblem getProblemById(Long id) {
        return dsaProblemRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new com.personalos.backend.exception.ResourceNotFoundException("DSA problem not found"));
    }

    public DsaProblem createProblem(DsaProblem problem) {
        problem.setUser(currentUserService.getCurrentUser()); // Isolated temporary mechanism for Stage 5A
        return dsaProblemRepository.save(problem);
    }

    public DsaProblem updateProblem(Long id, DsaProblem updatedProblem) {
        DsaProblem existingProblem = getProblemById(id);

        existingProblem.setTitle(updatedProblem.getTitle());
        existingProblem.setTopic(updatedProblem.getTopic());
        existingProblem.setDifficulty(updatedProblem.getDifficulty());
        existingProblem.setPlatform(updatedProblem.getPlatform());
        existingProblem.setProblemNumber(updatedProblem.getProblemNumber());
        existingProblem.setProblemLink(updatedProblem.getProblemLink());
        existingProblem.setNotes(updatedProblem.getNotes());
        existingProblem.setSolved(updatedProblem.isSolved());
        existingProblem.setRevisionStatus(updatedProblem.getRevisionStatus());
        existingProblem.setRevisionCount(updatedProblem.getRevisionCount());
        existingProblem.setNextRevisionDate(updatedProblem.getNextRevisionDate());

        return dsaProblemRepository.save(existingProblem);
    }

    public void deleteProblem(Long id) {
        if (!dsaProblemRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId()).isPresent()) {
            throw new com.personalos.backend.exception.ResourceNotFoundException("DSA problem not found");
        }

        dsaProblemRepository.deleteById(id);
    }
}