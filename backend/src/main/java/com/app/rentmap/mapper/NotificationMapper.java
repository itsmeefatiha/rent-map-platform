package com.app.rentmap.mapper;

import com.app.rentmap.dto.NotificationDto;
import com.app.rentmap.entity.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {
    @Mapping(target = "tenantId", source = "tenant.id")
    NotificationDto toDto(Notification notification);
}



