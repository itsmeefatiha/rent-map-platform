package com.app.rentmap.controller;

import com.app.rentmap.dto.PropertyDto;
import com.app.rentmap.service.FavoriteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasRole('TENANT')")
public class FavoriteController {
    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{propertyId}")
    public ResponseEntity<Void> addFavorite(Authentication authentication, @PathVariable Long propertyId) {
        String email = authentication.getName();
        favoriteService.addFavorite(email, propertyId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{propertyId}")
    public ResponseEntity<Void> removeFavorite(Authentication authentication, @PathVariable Long propertyId) {
        String email = authentication.getName();
        favoriteService.removeFavorite(email, propertyId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<PropertyDto>> getFavorites(Authentication authentication) {
        String email = authentication.getName();
        List<PropertyDto> favorites = favoriteService.getFavorites(email);
        return ResponseEntity.ok(favorites);
    }

    @GetMapping("/{propertyId}/check")
    public ResponseEntity<Boolean> isFavorite(Authentication authentication, @PathVariable Long propertyId) {
        String email = authentication.getName();
        boolean isFavorite = favoriteService.isFavorite(email, propertyId);
        return ResponseEntity.ok(isFavorite);
    }
}



