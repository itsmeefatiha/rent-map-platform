package com.app.rentmap.controller;

import com.app.rentmap.dto.ReviewDto;
import com.app.rentmap.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/owner/{ownerId}")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<ReviewDto> createReview(Authentication authentication, 
                                                  @PathVariable Long ownerId,
                                                  @Valid @RequestBody ReviewDto dto) {
        String email = authentication.getName();
        ReviewDto review = reviewService.createReview(email, ownerId, dto);
        return ResponseEntity.ok(review);
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<ReviewDto>> getReviewsByOwner(@PathVariable Long ownerId) {
        List<ReviewDto> reviews = reviewService.getReviewsByOwner(ownerId);
        return ResponseEntity.ok(reviews);
    }
}

