package com.app.rentmap.service;

import com.app.rentmap.dto.PropertyDto;
import com.app.rentmap.entity.Favorite;
import com.app.rentmap.entity.Property;
import com.app.rentmap.entity.Tenant;
import com.app.rentmap.entity.UserInteraction;
import com.app.rentmap.mapper.PropertyMapper;
import com.app.rentmap.repository.FavoriteRepository;
import com.app.rentmap.repository.PropertyRepository;
import com.app.rentmap.repository.TenantRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final TenantRepository tenantRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyMapper propertyMapper;
    private final RecommendationService recommendationService;

    public FavoriteService(FavoriteRepository favoriteRepository, TenantRepository tenantRepository,
                          PropertyRepository propertyRepository, PropertyMapper propertyMapper,
                          @Lazy RecommendationService recommendationService) {
        this.favoriteRepository = favoriteRepository;
        this.tenantRepository = tenantRepository;
        this.propertyRepository = propertyRepository;
        this.propertyMapper = propertyMapper;
        this.recommendationService = recommendationService;
    }

    @Transactional
    public void addFavorite(String tenantEmail, Long propertyId) {
        Tenant tenant = tenantRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (favoriteRepository.existsByTenantIdAndPropertyId(tenant.getId(), propertyId)) {
            throw new RuntimeException("Property already in favorites");
        }

        Favorite favorite = Favorite.builder()
                .tenant(tenant)
                .property(property)
                .build();
        favoriteRepository.save(favorite);
        
        // Enregistrer l'interaction FAVORITE
        try {
            recommendationService.recordInteraction(tenant.getId(), propertyId, 
                    UserInteraction.InteractionType.FAVORITE, null);
        } catch (Exception e) {
            // Ignorer les erreurs de tracking
        }
    }

    @Transactional
    public void removeFavorite(String tenantEmail, Long propertyId) {
        Tenant tenant = tenantRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));
        Favorite favorite = favoriteRepository.findByTenantIdAndPropertyId(tenant.getId(), propertyId)
                .orElseThrow(() -> new RuntimeException("Favorite not found"));
        favoriteRepository.delete(favorite);
    }

    public List<PropertyDto> getFavorites(String tenantEmail) {
        Tenant tenant = tenantRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));
        List<Favorite> favorites = favoriteRepository.findByTenantId(tenant.getId());
        return favorites.stream()
                .map(fav -> propertyMapper.toDto(fav.getProperty()))
                .toList();
    }

    public boolean isFavorite(String tenantEmail, Long propertyId) {
        Tenant tenant = tenantRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));
        return favoriteRepository.existsByTenantIdAndPropertyId(tenant.getId(), propertyId);
    }
}



