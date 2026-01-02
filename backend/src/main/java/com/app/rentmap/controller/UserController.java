package com.app.rentmap.controller;

import com.app.rentmap.dto.ChangePasswordRequest;
import com.app.rentmap.dto.OwnerDto;
import com.app.rentmap.dto.TenantDto;
import com.app.rentmap.dto.UserDto;
import com.app.rentmap.service.FileStorageService;
import com.app.rentmap.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {
    private final UserService userService;
    private final FileStorageService fileStorageService;

    public UserController(UserService userService, FileStorageService fileStorageService) {
        this.userService = userService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        UserDto user = userService.getCurrentUser(email);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/upload-profile-picture")
    public ResponseEntity<String> uploadProfilePicture(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        String email = authentication.getName();
        String fileUrl = fileStorageService.storeFile(file);
        userService.updateProfilePicture(email, fileUrl);
        return ResponseEntity.ok(fileUrl);
    }

    @PutMapping("/owner")
    public ResponseEntity<OwnerDto> updateOwner(Authentication authentication, @RequestBody OwnerDto dto) {
        String email = authentication.getName();
        OwnerDto updated = userService.updateOwner(email, dto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/tenant")
    public ResponseEntity<TenantDto> updateTenant(Authentication authentication, @RequestBody TenantDto dto) {
        String email = authentication.getName();
        TenantDto updated = userService.updateTenant(email, dto);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        String email = authentication.getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok("Password changed successfully");
    }
}

