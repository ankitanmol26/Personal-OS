package com.personalos.backend.service;

import com.personalos.backend.dto.NoteDTO;
import com.personalos.backend.entity.Note;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final CurrentUserService currentUserService;
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M/d/yyyy");

    @Autowired
    public NoteService(NoteRepository noteRepository, CurrentUserService currentUserService) {
        this.noteRepository = noteRepository;
        this.currentUserService = currentUserService;
    }

    public List<NoteDTO> getAllNotes() {
        return noteRepository.findByUserId(currentUserService.getCurrentUserId()).stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId())) // simple sort by ID desc to mimic "newNote, ...notes"
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public NoteDTO getNoteById(Long id) {
        Note note = noteRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));
        return mapToDTO(note);
    }

    public NoteDTO createNote(NoteDTO noteDTO) {
        Note note = new Note();
        note.setTitle(noteDTO.getTitle());
        note.setCategory(noteDTO.getCategory());
        note.setContent(noteDTO.getContent());
        note.setTags(noteDTO.getTags());
        note.setUser(currentUserService.getCurrentUser()); // Isolated temporary mechanism for Stage 5A
        
        Note savedNote = noteRepository.save(note);
        return mapToDTO(savedNote);
    }

    public NoteDTO updateNote(Long id, NoteDTO noteDTO) {
        Note note = noteRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));
        
        note.setTitle(noteDTO.getTitle());
        note.setCategory(noteDTO.getCategory());
        note.setContent(noteDTO.getContent());
        note.setTags(noteDTO.getTags());
        
        Note updatedNote = noteRepository.save(note);
        return mapToDTO(updatedNote);
    }

    public void deleteNote(Long id) {
        Note note = noteRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));
        noteRepository.delete(note);
    }

    private NoteDTO mapToDTO(Note note) {
        NoteDTO dto = new NoteDTO();
        dto.setId(note.getId());
        dto.setTitle(note.getTitle());
        dto.setCategory(note.getCategory());
        dto.setContent(note.getContent());
        dto.setTags(note.getTags());
        
        if (note.getCreatedAt() != null) {
            dto.setCreatedAt(note.getCreatedAt().format(formatter));
        }
        if (note.getUpdatedAt() != null) {
            dto.setUpdatedAt(note.getUpdatedAt().format(formatter));
        }
        
        return dto;
    }
}
