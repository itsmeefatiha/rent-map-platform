package com.app.rentmap.controller;

import com.app.rentmap.dto.PropertyCreateDto;
import com.app.rentmap.dto.PropertyDto;
import com.app.rentmap.service.FileStorageService;
import com.app.rentmap.service.PropertyService;
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

    public PropertyController(PropertyService propertyService, FileStorageService fileStorageService) {
        this.propertyService = propertyService;
        this.fileStorageService = fileStorageService;
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
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PropertyDto> properties = propertyService.getAllProperties(region, maxPrice, pageable);
        return ResponseEntity.ok(properties);
    }

    @GetMapping("/map")
    public ResponseEntity<List<PropertyDto>> getAllPropertiesForMap() {
        List<PropertyDto> properties = propertyService.getAllPropertiesForMap();
        return ResponseEntity.ok(properties);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyDto> getPropertyById(@PathVariable Long id) {
        PropertyDto property = propertyService.getPropertyById(id);
        return ResponseEntity.ok(property);
    }

    @GetMapping("/my-properties")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<PropertyDto>> getMyProperties(Authentication authentication) {
        String email = authentication.getName();
        List<PropertyDto> properties = propertyService.getPropertiesByOwner(email);
        return ResponseEntity.ok(properties);
    }
}

