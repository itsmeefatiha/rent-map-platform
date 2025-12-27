package com.app.rentmap.repository;

import com.app.rentmap.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByTenantIdAndPropertyId(Long tenantId, Long propertyId);
    List<Favorite> findByTenantId(Long tenantId);
    boolean existsByTenantIdAndPropertyId(Long tenantId, Long propertyId);
}



