package com.app.rentmap.repository;

import com.app.rentmap.entity.Property;
import com.app.rentmap.entity.Tenant;
import com.app.rentmap.entity.UserInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction, Long> {
    
    // Trouver une interaction spécifique
    Optional<UserInteraction> findByTenantIdAndPropertyIdAndInteractionType(
        Long tenantId, Long propertyId, UserInteraction.InteractionType interactionType);
    
    // Toutes les interactions d'un tenant
    List<UserInteraction> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    
    // Interactions récentes d'un tenant
    List<UserInteraction> findByTenantIdAndCreatedAtAfterOrderByCreatedAtDesc(
        Long tenantId, LocalDateTime since);
    
    // Propriétés les plus vues par un tenant
    @Query("SELECT ui.property FROM UserInteraction ui " +
           "WHERE ui.tenant.id = :tenantId " +
           "AND ui.interactionType = 'VIEW' " +
           "GROUP BY ui.property.id " +
           "ORDER BY COUNT(ui.id) DESC")
    List<Property> findMostViewedPropertiesByTenant(@Param("tenantId") Long tenantId);
    
    // Propriétés favorites d'un tenant
    @Query("SELECT ui.property FROM UserInteraction ui " +
           "WHERE ui.tenant.id = :tenantId " +
           "AND ui.interactionType = 'FAVORITE' " +
           "ORDER BY ui.createdAt DESC")
    List<Property> findFavoritePropertiesByTenant(@Param("tenantId") Long tenantId);
    
    // Score agrégé d'un tenant pour une propriété
    @Query("SELECT COALESCE(SUM(ui.interactionScore), 0.0) FROM UserInteraction ui " +
           "WHERE ui.tenant.id = :tenantId AND ui.property.id = :propertyId")
    Double getTotalInteractionScore(@Param("tenantId") Long tenantId, @Param("propertyId") Long propertyId);
    
    // Tenants qui ont interagi avec les mêmes propriétés
    @Query("SELECT DISTINCT ui2.tenant FROM UserInteraction ui1 " +
           "JOIN UserInteraction ui2 ON ui1.property.id = ui2.property.id " +
           "WHERE ui1.tenant.id = :tenantId " +
           "AND ui2.tenant.id != :tenantId " +
           "AND ui1.interactionType IN ('FAVORITE', 'CLICK') " +
           "AND ui2.interactionType IN ('FAVORITE', 'CLICK')")
    List<Tenant> findSimilarTenants(@Param("tenantId") Long tenantId);
    
    // Propriétés populaires (les plus interagies) - Retourne seulement les IDs
    @Query("SELECT ui.property.id, COUNT(ui.id) as interactionCount " +
           "FROM UserInteraction ui " +
           "WHERE ui.createdAt >= :since " +
           "GROUP BY ui.property.id " +
           "ORDER BY interactionCount DESC")
    List<Object[]> findPopularPropertyIds(@Param("since") LocalDateTime since);
    
    // Supprimer toutes les interactions d'une propriété
    void deleteByPropertyId(Long propertyId);
}

