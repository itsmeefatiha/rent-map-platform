package com.app.rentmap.repository;

import com.app.rentmap.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByTenantIdAndOwnerId(Long tenantId, Long ownerId);
    List<Review> findByOwnerId(Long ownerId);
}

