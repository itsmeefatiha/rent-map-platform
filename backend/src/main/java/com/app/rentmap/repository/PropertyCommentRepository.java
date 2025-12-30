package com.app.rentmap.repository;

import com.app.rentmap.entity.PropertyComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyCommentRepository extends JpaRepository<PropertyComment, Long> {
    List<PropertyComment> findByPropertyId(Long propertyId);
    List<PropertyComment> findByUserId(Long userId);
    List<PropertyComment> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);
}



