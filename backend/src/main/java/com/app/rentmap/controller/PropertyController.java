package com.app.rentmap.controller;

import com.app.rentmap.dto.PropertyCreateDto;
import com.app.rentmap.dto.PropertyDto;
import com.app.rentmap.entity.UserInteraction;
import com.app.rentmap.service.FileStorageService;
import com.app.rentmap.service.PropertyService;
import com.app.rentmap.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "http://localhost:5173")
public class PropertyController {
    private final PropertyService propertyService;
    private final FileStorageService fileStorageService;
    private final RecommendationService recommendationService;

    public PropertyController(PropertyService propertyService, FileStorageService fileStorageService,
                            RecommendationService recommendationService) {
        this.propertyService = propertyService;
        this.fileStorageService = fileStorageService;
        this.recommendationService = recommendationService;
    }

    @PostMapping("/upload-images")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<String>> uploadImages(@RequestParam("files") MultipartFile[] files) {
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String fileUrl = fileStorageService.storeFile(file);
                imageUrls.add(fileUrl);
            }
        }
        return ResponseEntity.ok(imageUrls);
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PropertyDto> createProperty(Authentication authentication, 
                                                      @Valid @RequestBody PropertyCreateDto dto) {
        String email = authentication.getName();
        PropertyDto property = propertyService.createProperty(email, dto);
        return ResponseEntity.ok(property);
    }

    @GetMapping
    public ResponseEntity<Page<PropertyDto>> getAllProperties(
            @RequestParam(required = false) String region,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PropertyDto> properties = propertyService.getAllProperties(region, maxPrice, pageable);
        
        // Enregistrer l'interaction SEARCH si l'utilisateur est un tenant
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TENANT"))) {
            try {
                String searchQuery = (region != null ? "region:" + region : "") + 
                                   (maxPrice != null ? " maxPrice:" + maxPrice : "");
                // Enregistrer pour chaque propriété dans les résultats
                properties.getContent().forEach(property -> {
                    try {
                        recommendationService.recordInteractionByEmail(
                            authentication.getName(),
                            property.getId(),
                            UserInteraction.InteractionType.SEARCH,
                            searchQuery.isEmpty() ? "all" : searchQuery
                        );
                    } catch (Exception e) {
                        // Ignorer les erreurs
                    }
                });
            } catch (Exception e) {
                // Ignorer les erreurs de tracking
            }
        }
        
        return ResponseEntity.ok(properties);
    }

    @GetMapping("/map")
    public ResponseEntity<List<PropertyDto>> getAllPropertiesForMap() {
        List<PropertyDto> properties = propertyService.getAllPropertiesForMap();
        return ResponseEntity.ok(properties);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyDto> getPropertyById(@PathVariable Long id, Authentication authentication) {
        PropertyDto property = propertyService.getPropertyById(id);
        
        // Enregistrer l'interaction VIEW si l'utilisateur est un tenant
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TENANT"))) {
            try {
                recommendationService.recordInteractionByEmail(
                    authentication.getName(), 
                    id, 
                    UserInteraction.InteractionType.VIEW, 
                    null
                );
            } catch (Exception e) {
                // Ignorer les erreurs de tracking pour ne pas affecter la réponse
            }
        }
        
        return ResponseEntity.ok(property);
    }

    @GetMapping("/my-properties")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<PropertyDto>> getMyProperties(Authentication authentication) {
        String email = authentication.getName();
        List<PropertyDto> properties = propertyService.getPropertiesByOwner(email);
        return ResponseEntity.ok(properties);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<PropertyDto> updateProperty(Authentication authentication,
                                                      @PathVariable Long id,
                                                      @Valid @RequestBody PropertyCreateDto dto) {
        String email = authentication.getName();
        PropertyDto property = propertyService.updateProperty(email, id, dto);
        return ResponseEntity.ok(property);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteProperty(Authentication authentication,
                                               @PathVariable Long id) {
        String email = authentication.getName();
        propertyService.deleteProperty(email, id);
        return ResponseEntity.noContent().build();
    }
}

