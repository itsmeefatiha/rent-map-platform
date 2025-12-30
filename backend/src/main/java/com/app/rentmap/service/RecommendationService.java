package com.app.rentmap.service;

import com.app.rentmap.dto.PropertyDto;
import com.app.rentmap.dto.RecommendationDto;
import com.app.rentmap.entity.*;
import com.app.rentmap.mapper.PropertyMapper;
import com.app.rentmap.repository.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {
    private final UserInteractionRepository interactionRepository;
    private final TenantRepository tenantRepository;
    private final PropertyRepository propertyRepository;
    private final FavoriteRepository favoriteRepository;
    private final PropertyMapper propertyMapper;
    private final PropertyCommentService propertyCommentService;

    public RecommendationService(
            UserInteractionRepository interactionRepository,
            TenantRepository tenantRepository,
            PropertyRepository propertyRepository,
            FavoriteRepository favoriteRepository,
            PropertyMapper propertyMapper,
            PropertyCommentService propertyCommentService) {
        this.interactionRepository = interactionRepository;
        this.tenantRepository = tenantRepository;
        this.propertyRepository = propertyRepository;
        this.favoriteRepository = favoriteRepository;
        this.propertyMapper = propertyMapper;
        this.propertyCommentService = propertyCommentService;
    }

    /**
     * Enregistre une interaction utilisateur
     */
    @Transactional
    public void recordInteraction(Long tenantId, Long propertyId, UserInteraction.InteractionType type, String searchQuery) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        // Vérifier si l'interaction existe déjà
        Optional<UserInteraction> existing = interactionRepository
                .findByTenantIdAndPropertyIdAndInteractionType(tenantId, propertyId, type);

        if (existing.isEmpty()) {
            UserInteraction interaction = UserInteraction.builder()
                    .tenant(tenant)
                    .property(property)
                    .interactionType(type)
                    .searchQuery(searchQuery)
                    .build();
            interactionRepository.save(interaction);
        }
    }

    /**
     * Enregistre une interaction utilisateur par email
     */
    @Transactional
    public void recordInteractionByEmail(String tenantEmail, Long propertyId, UserInteraction.InteractionType type, String searchQuery) {
        Tenant tenant = tenantRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));
        recordInteraction(tenant.getId(), propertyId, type, searchQuery);
    }

    /**
     * Obtient les recommandations pour un tenant
     */
    @Transactional(readOnly = true)
    public List<RecommendationDto> getRecommendations(String tenantEmail, int limit) {
        Tenant tenant = tenantRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));

        Map<Long, RecommendationDto> recommendations = new HashMap<>();

        // 1. Filtrage collaboratif (basé sur les utilisateurs similaires)
        List<RecommendationDto> collaborativeRecs = getCollaborativeFilteringRecommendations(tenant, limit);
        mergeRecommendations(recommendations, collaborativeRecs);

        // 2. Filtrage basé sur le contenu (propriétés similaires aux favoris)
        List<RecommendationDto> contentBasedRecs = getContentBasedRecommendations(tenant, limit);
        mergeRecommendations(recommendations, contentBasedRecs);

        // 3. Recommandations basées sur les préférences explicites
        List<RecommendationDto> preferenceBasedRecs = getPreferenceBasedRecommendations(tenant, limit);
        mergeRecommendations(recommendations, preferenceBasedRecs);

        // 4. Propriétés populaires (fallback)
        if (recommendations.size() < limit) {
            List<RecommendationDto> popularRecs = getPopularRecommendations(limit - recommendations.size());
            mergeRecommendations(recommendations, popularRecs);
        }

        // Trier par score et retourner les meilleures
        return recommendations.values().stream()
                .sorted((a, b) -> Double.compare(b.getRecommendationScore(), a.getRecommendationScore()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Filtrage collaboratif : trouve des propriétés aimées par des utilisateurs similaires
     */
    private List<RecommendationDto> getCollaborativeFilteringRecommendations(Tenant tenant, int limit) {
        List<Tenant> similarTenants = interactionRepository.findSimilarTenants(tenant.getId());
        
        if (similarTenants.isEmpty()) {
            return Collections.emptyList();
        }

        // Propriétés favorites des utilisateurs similaires
        Set<Long> tenantFavoriteIds = favoriteRepository.findByTenantId(tenant.getId()).stream()
                .map(f -> f.getProperty().getId())
                .collect(Collectors.toSet());

        Map<Long, Double> propertyScores = new HashMap<>();
        
        for (Tenant similarTenant : similarTenants) {
            List<Favorite> favorites = favoriteRepository.findByTenantId(similarTenant.getId());
            for (Favorite favorite : favorites) {
                Long propertyId = favorite.getProperty().getId();
                // Ignorer les propriétés déjà favorites du tenant
                if (!tenantFavoriteIds.contains(propertyId)) {
                    propertyScores.merge(propertyId, 0.8, Double::sum);
                }
            }
        }

        return propertyScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Property property = propertyRepository.findById(entry.getKey())
                            .orElse(null);
                    if (property == null) return null;
                    
                    PropertyDto dto = propertyMapper.toDto(property);
                    enrichPropertyDto(dto, property.getId());
                    
                    return RecommendationDto.builder()
                            .property(dto)
                            .recommendationScore(Math.min(entry.getValue() / similarTenants.size(), 1.0))
                            .reason("Recommandé par des utilisateurs ayant des goûts similaires")
                            .recommendationType("COLLABORATIVE")
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Filtrage basé sur le contenu : trouve des propriétés similaires aux favoris
     */
    private List<RecommendationDto> getContentBasedRecommendations(Tenant tenant, int limit) {
        List<Favorite> favorites = favoriteRepository.findByTenantId(tenant.getId());
        
        if (favorites.isEmpty()) {
            return Collections.emptyList();
        }

        // Analyser les propriétés favorites pour extraire les caractéristiques
        Map<String, Integer> preferredRegions = new HashMap<>();
        Map<String, Integer> preferredTypes = new HashMap<>();
        double avgPrice = 0;
        double avgArea = 0;
        int count = 0;

        for (Favorite favorite : favorites) {
            Property property = favorite.getProperty();
            preferredRegions.merge(property.getRegion(), 1, Integer::sum);
            if (property.getPropertyType() != null) {
                preferredTypes.merge(property.getPropertyType(), 1, Integer::sum);
            }
            avgPrice += property.getPrice().doubleValue();
            avgArea += property.getArea();
            count++;
        }

        if (count == 0) return Collections.emptyList();

        avgPrice /= count;
        avgArea /= count;

        String mostPreferredRegion = preferredRegions.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
        String mostPreferredType = preferredTypes.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        // Trouver des propriétés similaires
        Set<Long> favoriteIds = favorites.stream()
                .map(f -> f.getProperty().getId())
                .collect(Collectors.toSet());

        List<Property> allProperties = propertyRepository.findAll();
        Map<Long, Double> similarityScores = new HashMap<>();

        for (Property property : allProperties) {
            if (favoriteIds.contains(property.getId())) continue;

            double score = 0.0;

            // Région
            if (mostPreferredRegion != null && property.getRegion().equalsIgnoreCase(mostPreferredRegion)) {
                score += 0.3;
            }

            // Type de propriété
            if (mostPreferredType != null && mostPreferredType.equals(property.getPropertyType())) {
                score += 0.2;
            }

            // Prix (proximité)
            double priceDiff = Math.abs(property.getPrice().doubleValue() - avgPrice) / avgPrice;
            if (priceDiff < 0.2) {
                score += 0.2;
            } else if (priceDiff < 0.4) {
                score += 0.1;
            }

            // Surface
            double areaDiff = Math.abs(property.getArea() - avgArea) / avgArea;
            if (areaDiff < 0.2) {
                score += 0.15;
            } else if (areaDiff < 0.4) {
                score += 0.075;
            }

            // Caractéristiques communes
            for (Favorite favorite : favorites) {
                Property favProperty = favorite.getProperty();
                int commonFeatures = countCommonFeatures(property, favProperty);
                score += commonFeatures * 0.05;
            }

            similarityScores.put(property.getId(), Math.min(score, 1.0));
        }

        return similarityScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Property property = propertyRepository.findById(entry.getKey()).orElse(null);
                    if (property == null) return null;
                    
                    PropertyDto dto = propertyMapper.toDto(property);
                    enrichPropertyDto(dto, property.getId());
                    
                    return RecommendationDto.builder()
                            .property(dto)
                            .recommendationScore(entry.getValue())
                            .reason("Similaire aux propriétés que vous avez aimées")
                            .recommendationType("CONTENT_BASED")
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Recommandations basées sur les préférences explicites du tenant
     */
    private List<RecommendationDto> getPreferenceBasedRecommendations(Tenant tenant, int limit) {
        List<Property> allProperties = propertyRepository.findAll();
        Set<Long> favoriteIds = favoriteRepository.findByTenantId(tenant.getId()).stream()
                .map(f -> f.getProperty().getId())
                .collect(Collectors.toSet());

        Map<Long, Double> scores = new HashMap<>();

        for (Property property : allProperties) {
            if (favoriteIds.contains(property.getId())) continue;

            double score = 0.0;

            // Région préférée
            if (tenant.getPreferredRegion() != null && 
                property.getRegion().equalsIgnoreCase(tenant.getPreferredRegion())) {
                score += 0.4;
            }

            // Budget
            if (tenant.getMaxBudget() != null && 
                property.getPrice().doubleValue() <= tenant.getMaxBudget()) {
                score += 0.3;
            } else if (tenant.getMaxBudget() != null) {
                // Pénalité si dépassement du budget
                double overBudget = (property.getPrice().doubleValue() - tenant.getMaxBudget()) / tenant.getMaxBudget();
                if (overBudget < 0.1) {
                    score += 0.1; // Légèrement au-dessus mais acceptable
                }
            }

            // Disponibilité
            if (property.getAvailability().isBefore(LocalDateTime.now().toLocalDate()) ||
                property.getAvailability().isEqual(LocalDateTime.now().toLocalDate())) {
                score += 0.2;
            }

            // Score d'interaction précédente
            Double interactionScore = interactionRepository.getTotalInteractionScore(tenant.getId(), property.getId());
            if (interactionScore != null && interactionScore > 0) {
                score += Math.min(interactionScore * 0.1, 0.1);
            }

            if (score > 0) {
                scores.put(property.getId(), score);
            }
        }

        return scores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Property property = propertyRepository.findById(entry.getKey()).orElse(null);
                    if (property == null) return null;
                    
                    PropertyDto dto = propertyMapper.toDto(property);
                    enrichPropertyDto(dto, property.getId());
                    
                    return RecommendationDto.builder()
                            .property(dto)
                            .recommendationScore(entry.getValue())
                            .reason("Correspond à vos préférences")
                            .recommendationType("PREFERENCE_BASED")
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Propriétés populaires (fallback)
     */
    private List<RecommendationDto> getPopularRecommendations(int limit) {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Object[]> popularData = interactionRepository.findPopularPropertyIds(since);

        return popularData.stream()
                .limit(limit)
                .map(data -> {
                    Long propertyId = ((Number) data[0]).longValue();
                    Property property = propertyRepository.findById(propertyId).orElse(null);
                    if (property == null) return null;
                    
                    PropertyDto dto = propertyMapper.toDto(property);
                    enrichPropertyDto(dto, property.getId());
                    
                    return RecommendationDto.builder()
                            .property(dto)
                            .recommendationScore(0.5) // Score de base pour les populaires
                            .reason("Propriété populaire")
                            .recommendationType("POPULAR")
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Compte les caractéristiques communes entre deux propriétés
     */
    private int countCommonFeatures(Property p1, Property p2) {
        int count = 0;
        if (Boolean.TRUE.equals(p1.getHasWifi()) && Boolean.TRUE.equals(p2.getHasWifi())) count++;
        if (Boolean.TRUE.equals(p1.getHasParking()) && Boolean.TRUE.equals(p2.getHasParking())) count++;
        if (Boolean.TRUE.equals(p1.getHasAirConditioning()) && Boolean.TRUE.equals(p2.getHasAirConditioning())) count++;
        if (Boolean.TRUE.equals(p1.getHasHeating()) && Boolean.TRUE.equals(p2.getHasHeating())) count++;
        if (Boolean.TRUE.equals(p1.getHasFurnished()) && Boolean.TRUE.equals(p2.getHasFurnished())) count++;
        if (Boolean.TRUE.equals(p1.getPetsAllowed()) && Boolean.TRUE.equals(p2.getPetsAllowed())) count++;
        if (p1.getNumberOfBedrooms() != null && p2.getNumberOfBedrooms() != null &&
            p1.getNumberOfBedrooms().equals(p2.getNumberOfBedrooms())) count++;
        if (p1.getNumberOfBathrooms() != null && p2.getNumberOfBathrooms() != null &&
            p1.getNumberOfBathrooms().equals(p2.getNumberOfBathrooms())) count++;
        return count;
    }

    /**
     * Fusionne les recommandations en combinant les scores
     */
    private void mergeRecommendations(Map<Long, RecommendationDto> target, List<RecommendationDto> newRecs) {
        for (RecommendationDto rec : newRecs) {
            Long propertyId = rec.getProperty().getId();
            if (target.containsKey(propertyId)) {
                // Combiner les scores (moyenne pondérée)
                RecommendationDto existing = target.get(propertyId);
                double combinedScore = (existing.getRecommendationScore() + rec.getRecommendationScore()) / 2.0;
                existing.setRecommendationScore(Math.min(combinedScore, 1.0));
                existing.setReason(existing.getReason() + " | " + rec.getReason());
            } else {
                target.put(propertyId, rec);
            }
        }
    }

    /**
     * Enrichit le DTO avec les commentaires et ratings
     */
    private void enrichPropertyDto(PropertyDto dto, Long propertyId) {
        var comments = propertyCommentService.getCommentsByProperty(propertyId, null);
        dto.setComments(comments);
        dto.setTotalComments(comments.size());
        dto.setAverageRating(propertyCommentService.getAverageRating(propertyId));
    }
}

