package com.personalos.backend.controller;

import com.personalos.backend.entity.DsaProblem;
import com.personalos.backend.service.DsaProblemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dsa")
public class DsaProblemController {

    private final DsaProblemService dsaProblemService;

    public DsaProblemController(DsaProblemService dsaProblemService) {
        this.dsaProblemService = dsaProblemService;
    }

    @GetMapping
    public ResponseEntity<List<DsaProblem>> getAllProblems() {
        return ResponseEntity.ok(dsaProblemService.getAllProblems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DsaProblem> getProblemById(@PathVariable Long id) {
        return ResponseEntity.ok(dsaProblemService.getProblemById(id));
    }

    @PostMapping
    public ResponseEntity<DsaProblem> createProblem(
            @RequestBody DsaProblem problem) {

        DsaProblem createdProblem = dsaProblemService.createProblem(problem);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdProblem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DsaProblem> updateProblem(
            @PathVariable Long id,
            @RequestBody DsaProblem problem) {

        return ResponseEntity.ok(
                dsaProblemService.updateProblem(id, problem)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProblem(@PathVariable Long id) {

        dsaProblemService.deleteProblem(id);

        return ResponseEntity.noContent().build();
    }
}