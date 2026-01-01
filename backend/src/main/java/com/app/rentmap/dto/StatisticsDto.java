package com.app.rentmap.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsDto {
    private Long totalProperties;
    private Long totalUsers;
    private Long totalCities;
    private Double satisfactionRate; // Pourcentage (0-100)
}

