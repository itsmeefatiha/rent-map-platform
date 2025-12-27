package com.app.rentmap.repository;

import com.app.rentmap.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    List<Notification> findByTenantIdAndReadFalse(Long tenantId);
    long countByTenantIdAndReadFalse(Long tenantId);
}



