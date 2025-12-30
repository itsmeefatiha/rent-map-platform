package com.app.rentmap.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyCommentDto {
    private Long id;
    
    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;
    
    private String comment; // Peut contenir du texte ou des emojis
    
    private Long propertyId;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long parentCommentId;
    private Integer likeCount;
    private Boolean isLikedByCurrentUser;
    private java.util.List<PropertyCommentDto> replies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

