package com.app.rentmap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationDto {
    private PropertyDto property;
    private Double recommendationScore; // Score de recommandation (0.0 à 1.0)
    private String reason; // Raison de la recommandation
    private String recommendationType; // COLLABORATIVE, CONTENT_BASED, POPULAR, SIMILAR
}

