package com.app.rentmap.service;

import com.app.rentmap.dto.StatisticsDto;
import com.app.rentmap.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class StatisticsService {
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final PropertyCommentRepository propertyCommentRepository;

    public StatisticsService(
            PropertyRepository propertyRepository,
            UserRepository userRepository,
            ReviewRepository reviewRepository,
            PropertyCommentRepository propertyCommentRepository) {
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.propertyCommentRepository = propertyCommentRepository;
    }

    public StatisticsDto getStatistics() {
        // Compter le nombre total de propriétés
        long totalProperties = propertyRepository.count();

        // Compter le nombre total d'utilisateurs
        long totalUsers = userRepository.count();

        // Compter le nombre de villes distinctes (régions)
        long totalCities = propertyRepository.countDistinctRegions();

        // Calculer le taux de satisfaction basé sur les notes moyennes
        // On combine les reviews (Owner reviews) et les PropertyComments (Property ratings)
        double satisfactionRate = calculateSatisfactionRate();

        return new StatisticsDto(totalProperties, totalUsers, totalCities, satisfactionRate);
    }

    private double calculateSatisfactionRate() {
        // Récupérer toutes les reviews
        List<com.app.rentmap.entity.Review> reviews = reviewRepository.findAll();
        
        // Récupérer tous les commentaires de propriétés avec rating
        List<com.app.rentmap.entity.PropertyComment> comments = propertyCommentRepository.findAll()
                .stream()
                .filter(comment -> comment.getRating() != null)
                .toList();

        if (reviews.isEmpty() && comments.isEmpty()) {
            // Si aucune note n'existe, retourner un taux par défaut
            return 98.0;
        }

        // Calculer la moyenne des reviews
        double reviewsAverage = reviews.stream()
                .mapToInt(com.app.rentmap.entity.Review::getRating)
                .average()
                .orElse(0.0);

        // Calculer la moyenne des commentaires
        double commentsAverage = comments.stream()
                .mapToInt(com.app.rentmap.entity.PropertyComment::getRating)
                .average()
                .orElse(0.0);

        // Combiner les deux moyennes (pondération égale si les deux existent)
        double combinedAverage;
        if (reviews.isEmpty()) {
            combinedAverage = commentsAverage;
        } else if (comments.isEmpty()) {
            combinedAverage = reviewsAverage;
        } else {
            // Moyenne pondérée par le nombre d'éléments
            int totalCount = reviews.size() + comments.size();
            combinedAverage = (reviewsAverage * reviews.size() + commentsAverage * comments.size()) / totalCount;
        }

        // Convertir la note moyenne (sur 5) en pourcentage (sur 100)
        // Exemple: 4.9/5 = 98%
        return (combinedAverage / 5.0) * 100.0;
    }
}

