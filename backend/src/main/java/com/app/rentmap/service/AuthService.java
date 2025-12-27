package com.app.rentmap.service;

import com.app.rentmap.dto.AuthRequest;
import com.app.rentmap.dto.AuthResponse;
import com.app.rentmap.dto.RegisterRequest;
import com.app.rentmap.entity.Owner;
import com.app.rentmap.entity.Tenant;
import com.app.rentmap.entity.User;
import com.app.rentmap.repository.OwnerRepository;
import com.app.rentmap.repository.TenantRepository;
import com.app.rentmap.repository.UserRepository;
import com.app.rentmap.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final OwnerRepository ownerRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, OwnerRepository ownerRepository,
                      TenantRepository tenantRepository, PasswordEncoder passwordEncoder,
                      JwtTokenProvider tokenProvider, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.ownerRepository = ownerRepository;
        this.tenantRepository = tenantRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user;
        if ("OWNER".equalsIgnoreCase(request.getRole())) {
            Owner owner = Owner.builder()
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .phoneNumber(request.getPhoneNumber())
                    .role("OWNER")
                    .build();
            user = ownerRepository.save(owner);
        } else {
            Tenant tenant = Tenant.builder()
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .phoneNumber(request.getPhoneNumber())
                    .role("TENANT")
                    .build();
            user = tenantRepository.save(tenant);
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole(), user.getId());
        return new AuthResponse(token, user.getEmail(), user.getRole(), user.getId());
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = (User) authentication.getPrincipal();
        String token = tokenProvider.generateToken(user.getEmail(), user.getRole(), user.getId());
        return new AuthResponse(token, user.getEmail(), user.getRole(), user.getId());
    }
}



