package com.app.rentmap.service;

import com.app.rentmap.dto.ReviewDto;
import com.app.rentmap.entity.Owner;
import com.app.rentmap.entity.Review;
import com.app.rentmap.entity.Tenant;
import com.app.rentmap.mapper.ReviewMapper;
import com.app.rentmap.repository.OwnerRepository;
import com.app.rentmap.repository.ReviewRepository;
import com.app.rentmap.repository.TenantRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final TenantRepository tenantRepository;
    private final OwnerRepository ownerRepository;
    private final ReviewMapper reviewMapper;

    public ReviewService(ReviewRepository reviewRepository, TenantRepository tenantRepository,
                        OwnerRepository ownerRepository, ReviewMapper reviewMapper) {
        this.reviewRepository = reviewRepository;
        this.tenantRepository = tenantRepository;
        this.ownerRepository = ownerRepository;
        this.reviewMapper = reviewMapper;
    }

    @Transactional
    public ReviewDto createReview(String tenantEmail, Long ownerId, ReviewDto dto) {
        Tenant tenant = tenantRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));
        Owner owner = ownerRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        if (reviewRepository.findByTenantIdAndOwnerId(tenant.getId(), ownerId).isPresent()) {
            throw new RuntimeException("Review already exists for this owner");
        }

        Review review = Review.builder()
                .rating(dto.getRating())
                .comment(dto.getComment())
                .tenant(tenant)
                .owner(owner)
                .build();

        Review saved = reviewRepository.save(review);
        return reviewMapper.toDto(saved);
    }

    public List<ReviewDto> getReviewsByOwner(Long ownerId) {
        List<Review> reviews = reviewRepository.findByOwnerId(ownerId);
        return reviews.stream().map(reviewMapper::toDto).toList();
    }
}

