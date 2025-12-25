package com.app.rentmap.mapper;

import com.app.rentmap.dto.PropertyCreateDto;
import com.app.rentmap.dto.PropertyDto;
import com.app.rentmap.entity.Property;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface PropertyMapper {
    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "ownerName", expression = "java(property.getOwner().getFirstName() + \" \" + property.getOwner().getLastName())")
    @Mapping(target = "ownerEmail", source = "owner.email")
    @Mapping(target = "imageUrls", expression = "java(mapImages(property))")
    @Mapping(target = "numberOfRooms", source = "numberOfRooms")
    @Mapping(target = "numberOfBedrooms", source = "numberOfBedrooms")
    @Mapping(target = "numberOfBathrooms", source = "numberOfBathrooms")
    @Mapping(target = "hasWifi", source = "hasWifi")
    @Mapping(target = "hasParking", source = "hasParking")
    @Mapping(target = "hasAirConditioning", source = "hasAirConditioning")
    @Mapping(target = "hasHeating", source = "hasHeating")
    @Mapping(target = "hasFurnished", source = "hasFurnished")
    @Mapping(target = "petsAllowed", source = "petsAllowed")
    @Mapping(target = "propertyType", source = "propertyType")
    PropertyDto toDto(Property property);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "favorites", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "numberOfRooms", source = "numberOfRooms")
    @Mapping(target = "numberOfBedrooms", source = "numberOfBedrooms")
    @Mapping(target = "numberOfBathrooms", source = "numberOfBathrooms")
    @Mapping(target = "hasWifi", source = "hasWifi")
    @Mapping(target = "hasParking", source = "hasParking")
    @Mapping(target = "hasAirConditioning", source = "hasAirConditioning")
    @Mapping(target = "hasHeating", source = "hasHeating")
    @Mapping(target = "hasFurnished", source = "hasFurnished")
    @Mapping(target = "petsAllowed", source = "petsAllowed")
    @Mapping(target = "propertyType", source = "propertyType")
    Property toEntity(PropertyCreateDto dto);

    default List<String> mapImages(Property property) {
        if (property.getImages() == null) {
            return List.of();
        }
        return property.getImages().stream()
                .sorted((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()))
                .map(img -> img.getImageUrl())
                .collect(Collectors.toList());
    }
}

