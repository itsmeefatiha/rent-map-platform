package com.app.rentmap.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_interactions", indexes = {
    @Index(name = "idx_tenant_property", columnList = "tenant_id,property_id"),
    @Index(name = "idx_tenant_created", columnList = "tenant_id,created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInteraction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private InteractionType interactionType; // VIEW, SEARCH, CLICK, FAVORITE

    private String searchQuery; // Pour les interactions de type SEARCH
    private Double interactionScore; // Score de l'interaction (0.0 à 1.0)

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (interactionScore == null) {
            // Score par défaut basé sur le type d'interaction
            interactionScore = switch (interactionType) {
                case FAVORITE -> 1.0;
                case CLICK -> 0.7;
                case VIEW -> 0.5;
                case SEARCH -> 0.3;
            };
        }
    }

    public enum InteractionType {
        VIEW,      // Vue d'une propriété
        CLICK,     // Clic sur une propriété
        FAVORITE,  // Ajout aux favoris
        SEARCH     // Recherche avec cette propriété dans les résultats
    }
}

