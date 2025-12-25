package com.app.rentmap.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyCreateDto {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Area is required")
    @DecimalMin(value = "0.0", message = "Area must be positive")
    private Double area;

    @NotBlank(message = "Region is required")
    private String region;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    @NotNull(message = "Availability is required")
    private LocalDate availability;

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

    private List<String> imageUrls;
}

