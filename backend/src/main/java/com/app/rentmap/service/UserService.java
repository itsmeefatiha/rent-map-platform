package com.app.rentmap.service;

import com.app.rentmap.dto.ChangePasswordRequest;
import com.app.rentmap.dto.OwnerDto;
import com.app.rentmap.dto.TenantDto;
import com.app.rentmap.dto.UserDto;
import com.app.rentmap.entity.Owner;
import com.app.rentmap.entity.Tenant;
import com.app.rentmap.entity.User;
import com.app.rentmap.mapper.UserMapper;
import com.app.rentmap.repository.OwnerRepository;
import com.app.rentmap.repository.TenantRepository;
import com.app.rentmap.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final OwnerRepository ownerRepository;
    private final TenantRepository tenantRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, OwnerRepository ownerRepository,
                      TenantRepository tenantRepository, UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.ownerRepository = ownerRepository;
        this.tenantRepository = tenantRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return userMapper.toDto(user);
    }

    @Transactional
    public OwnerDto updateOwner(String email, OwnerDto dto) {
        Owner owner = ownerRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found"));

        owner.setFirstName(dto.getFirstName());
        owner.setLastName(dto.getLastName());
        owner.setPhoneNumber(dto.getPhoneNumber());
        owner.setProfilePicture(dto.getProfilePicture());
        owner.setBio(dto.getBio());
        owner.setCompanyName(dto.getCompanyName());
        owner.setLicenseNumber(dto.getLicenseNumber());

        Owner updated = ownerRepository.save(owner);
        OwnerDto result = new OwnerDto();
        copyUserFields(updated, result);
        result.setCompanyName(updated.getCompanyName());
        result.setLicenseNumber(updated.getLicenseNumber());
        return result;
    }

    @Transactional
    public TenantDto updateTenant(String email, TenantDto dto) {
        Tenant tenant = tenantRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));

        tenant.setFirstName(dto.getFirstName());
        tenant.setLastName(dto.getLastName());
        tenant.setPhoneNumber(dto.getPhoneNumber());
        tenant.setProfilePicture(dto.getProfilePicture());
        tenant.setBio(dto.getBio());
        tenant.setPreferredRegion(dto.getPreferredRegion());
        tenant.setMaxBudget(dto.getMaxBudget());

        Tenant updated = tenantRepository.save(tenant);
        TenantDto result = new TenantDto();
        copyUserFields(updated, result);
        result.setPreferredRegion(updated.getPreferredRegion());
        result.setMaxBudget(updated.getMaxBudget());
        return result;
    }

    public void updateProfilePicture(String email, String profilePictureUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        // Delete old profile picture if exists
        if (user.getProfilePicture() != null && user.getProfilePicture().startsWith("/uploads/")) {
            // File deletion handled by service if needed
        }
        
        user.setProfilePicture(profilePictureUrl);
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private void copyUserFields(User user, UserDto dto) {
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setProfilePicture(user.getProfilePicture());
        dto.setBio(user.getBio());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
    }
}

