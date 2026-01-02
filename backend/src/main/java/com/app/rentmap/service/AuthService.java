package com.app.rentmap.service;

import com.app.rentmap.dto.AuthRequest;
import com.app.rentmap.dto.AuthResponse;
import com.app.rentmap.dto.ForgotPasswordRequest;
import com.app.rentmap.dto.RegisterRequest;
import com.app.rentmap.dto.ResetPasswordRequest;
import com.app.rentmap.entity.Owner;
import com.app.rentmap.entity.PasswordResetToken;
import com.app.rentmap.entity.Tenant;
import com.app.rentmap.entity.User;
import com.app.rentmap.repository.OwnerRepository;
import com.app.rentmap.repository.PasswordResetTokenRepository;
import com.app.rentmap.repository.TenantRepository;
import com.app.rentmap.repository.UserRepository;
import com.app.rentmap.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final OwnerRepository ownerRepository;
    private final TenantRepository tenantRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, OwnerRepository ownerRepository,
                      TenantRepository tenantRepository, PasswordResetTokenRepository passwordResetTokenRepository,
                      PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider,
                      AuthenticationManager authenticationManager, EmailService emailService) {
        this.userRepository = userRepository;
        this.ownerRepository = ownerRepository;
        this.tenantRepository = tenantRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
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

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        // Always return success to prevent email enumeration
        if (user == null) {
            return;
        }

        // Delete any existing tokens for this user
        passwordResetTokenRepository.deleteByUserEmail(user.getEmail());

        // Generate a new token
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusHours(24); // Token valid for 24 hours

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(expiryDate)
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);

        // Send email with reset link
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (resetToken.getUsed()) {
            throw new RuntimeException("This reset token has already been used");
        }

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("This reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }
}



