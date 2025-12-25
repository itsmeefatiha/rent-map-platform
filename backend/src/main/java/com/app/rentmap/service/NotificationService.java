package com.app.rentmap.service;

import com.app.rentmap.dto.NotificationDto;
import com.app.rentmap.entity.Notification;
import com.app.rentmap.entity.Property;
import com.app.rentmap.entity.Tenant;
import com.app.rentmap.mapper.NotificationMapper;
import com.app.rentmap.repository.NotificationRepository;
import com.app.rentmap.repository.TenantRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final TenantRepository tenantRepository;
    private final NotificationMapper notificationMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, TenantRepository tenantRepository,
                              NotificationMapper notificationMapper, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.tenantRepository = tenantRepository;
        this.notificationMapper = notificationMapper;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void notifyMatchingTenants(Property property) {
        List<Tenant> tenants = tenantRepository.findAll();
        for (Tenant tenant : tenants) {
            boolean matches = false;
            if (tenant.getPreferredRegion() != null && 
                tenant.getPreferredRegion().equalsIgnoreCase(property.getRegion())) {
                matches = true;
            }
            if (tenant.getMaxBudget() != null && 
                property.getPrice().doubleValue() <= tenant.getMaxBudget()) {
                matches = true;
            }

            if (matches) {
                Notification notification = Notification.builder()
                        .title("New Property Available")
                        .message("A new property matching your preferences has been published: " + property.getTitle())
                        .type("PROPERTY_MATCH")
                        .tenant(tenant)
                        .read(false)
                        .build();
                Notification saved = notificationRepository.save(notification);
                
                messagingTemplate.convertAndSend("/topic/notifications/" + tenant.getId(), 
                        notificationMapper.toDto(saved));
            }
        }
    }

    public List<NotificationDto> getNotifications(String tenantEmail) {
        Tenant tenant = tenantRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));
        List<Notification> notifications = notificationRepository.findByTenantIdOrderByCreatedAtDesc(tenant.getId());
        return notifications.stream().map(notificationMapper::toDto).toList();
    }

    @Transactional
    public void markAsRead(Long notificationId, String tenantEmail) {
        Tenant tenant = tenantRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getTenant().getId().equals(tenant.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public long getUnreadCount(String tenantEmail) {
        Tenant tenant = tenantRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Tenant not found"));
        return notificationRepository.countByTenantIdAndReadFalse(tenant.getId());
    }
}

