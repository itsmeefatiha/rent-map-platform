package com.app.rentmap.controller;

import com.app.rentmap.dto.PropertyCommentCreateDto;
import com.app.rentmap.dto.PropertyCommentDto;
import com.app.rentmap.repository.UserRepository;
import com.app.rentmap.service.PropertyCommentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties/{propertyId}/comments")
@CrossOrigin(origins = "http://localhost:5173")
public class PropertyCommentController {
    private final PropertyCommentService propertyCommentService;
    private final UserRepository userRepository;

    public PropertyCommentController(PropertyCommentService propertyCommentService,
                                    UserRepository userRepository) {
        this.propertyCommentService = propertyCommentService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<PropertyCommentDto> createComment(Authentication authentication,
                                                           @PathVariable Long propertyId,
                                                           @Valid @RequestBody PropertyCommentCreateDto dto) {
        String email = authentication.getName();
        PropertyCommentDto comment = propertyCommentService.createComment(email, propertyId, dto);
        return ResponseEntity.ok(comment);
    }

    @GetMapping
    public ResponseEntity<List<PropertyCommentDto>> getCommentsByProperty(
            @PathVariable Long propertyId,
            Authentication authentication) {
        Long currentUserId = null;
        if (authentication != null) {
            try {
                var user = userRepository.findByEmail(authentication.getName());
                if (user.isPresent()) {
                    currentUserId = user.get().getId();
                }
            } catch (Exception e) {
                // User not found or not authenticated, continue without user context
            }
        }
        List<PropertyCommentDto> comments = propertyCommentService.getCommentsByProperty(propertyId, currentUserId);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/{commentId}/like")
    public ResponseEntity<Void> toggleLike(Authentication authentication,
                                           @PathVariable Long propertyId,
                                           @PathVariable Long commentId) {
        String email = authentication.getName();
        propertyCommentService.toggleLike(email, commentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{commentId}/reply")
    public ResponseEntity<PropertyCommentDto> createReply(Authentication authentication,
                                                          @PathVariable Long propertyId,
                                                          @PathVariable Long commentId,
                                                          @Valid @RequestBody PropertyCommentCreateDto dto) {
        String email = authentication.getName();
        dto.setParentCommentId(commentId);
        PropertyCommentDto reply = propertyCommentService.createComment(email, propertyId, dto);
        return ResponseEntity.ok(reply);
    }

    @GetMapping("/average-rating")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long propertyId) {
        Double averageRating = propertyCommentService.getAverageRating(propertyId);
        return ResponseEntity.ok(averageRating);
    }
}

