package com.personalos.backend.service;

import com.personalos.backend.entity.DsaProblem;
import com.personalos.backend.repository.DsaProblemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DsaProblemService {

    private final DsaProblemRepository dsaProblemRepository;

    public DsaProblemService(DsaProblemRepository dsaProblemRepository) {
        this.dsaProblemRepository = dsaProblemRepository;
    }

    public List<DsaProblem> getAllProblems() {
        return dsaProblemRepository.findAll();
    }

    public DsaProblem getProblemById(Long id) {
        return dsaProblemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("DSA problem not found"));
    }

    public DsaProblem createProblem(DsaProblem problem) {
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
        if (!dsaProblemRepository.existsById(id)) {
            throw new RuntimeException("DSA problem not found");
        }

        dsaProblemRepository.deleteById(id);
    }
}