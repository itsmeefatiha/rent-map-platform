package com.app.rentmap.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyDto {
    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private Double area;
    private String region;
    private Double latitude;
    private Double longitude;
    private LocalDate availability;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private List<String> imageUrls;
    private Integer numberOfRooms;
    private Integer numberOfBedrooms;
    private Integer numberOfBathrooms;
    private Boolean hasWifi;
    private Boolean hasParking;
    private Boolean hasAirConditioning;
    private Boolean hasHeating;
    private Boolean hasFurnished;
    private Boolean petsAllowed;
    private String propertyType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

