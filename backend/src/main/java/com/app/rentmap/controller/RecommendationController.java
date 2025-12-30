package com.app.rentmap.controller;

import com.app.rentmap.dto.RecommendationDto;
import com.app.rentmap.entity.UserInteraction;
import com.app.rentmap.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "http://localhost:5173")
@Tag(name = "Recommendations", description = "API pour les recommandations de propriétés basées sur l'IA")
@SecurityRequirement(name = "bearerAuth")
public class RecommendationController {
    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    @Operation(summary = "Obtenir les recommandations personnalisées", 
               description = "Retourne une liste de propriétés recommandées basées sur l'IA pour le tenant connecté")
    public ResponseEntity<?> getRecommendations(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(403)
                    .body("Authentification requise");
        }
        
        // Vérifier que l'utilisateur est un TENANT
        boolean isTenant = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TENANT"));
        
        if (!isTenant) {
            return ResponseEntity.status(403)
                    .body("Accès réservé aux locataires");
        }
        
        try {
            String email = authentication.getName();
            List<RecommendationDto> recommendations = recommendationService.getRecommendations(email, limit);
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Erreur lors de la récupération des recommandations: " + e.getMessage());
        }
    }

    @PostMapping("/interactions")
    @Operation(summary = "Enregistrer une interaction utilisateur",
               description = "Enregistre une interaction (vue, clic, favori) pour améliorer les recommandations")
    public ResponseEntity<Void> recordInteraction(
            @RequestParam Long propertyId,
            @RequestParam String interactionType,
            @RequestParam(required = false) String searchQuery,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(403).build();
        }
        
        // Vérifier que l'utilisateur est un TENANT
        boolean isTenant = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TENANT"));
        
        if (!isTenant) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            String email = authentication.getName();
            // Convertir la String en Enum
            UserInteraction.InteractionType type = UserInteraction.InteractionType.valueOf(interactionType.toUpperCase());
            recommendationService.recordInteractionByEmail(email, propertyId, type, searchQuery);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

