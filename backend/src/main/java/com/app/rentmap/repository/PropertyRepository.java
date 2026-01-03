package com.app.rentmap.repository;

import com.app.rentmap.entity.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {
    Page<Property> findByRegion(String region, Pageable pageable);
    
    @Query("SELECT p FROM Property p WHERE p.price <= :maxPrice")
    Page<Property> findByMaxPrice(@Param("maxPrice") BigDecimal maxPrice, Pageable pageable);
    
    @Query("SELECT p FROM Property p WHERE p.region = :region AND p.price <= :maxPrice")
    Page<Property> findByRegionAndMaxPrice(@Param("region") String region, 
                                           @Param("maxPrice") BigDecimal maxPrice, 
                                           Pageable pageable);
    
    @Query("SELECT COUNT(DISTINCT p.region) FROM Property p")
    long countDistinctRegions();
    
    List<Property> findByOwnerId(Long ownerId);
}

