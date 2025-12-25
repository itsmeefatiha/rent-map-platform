package com.app.rentmap.service;

import com.app.rentmap.dto.PropertyCreateDto;
import com.app.rentmap.dto.PropertyDto;
import com.app.rentmap.entity.Owner;
import com.app.rentmap.entity.Property;
import com.app.rentmap.entity.PropertyImage;
import com.app.rentmap.mapper.PropertyMapper;
import com.app.rentmap.repository.OwnerRepository;
import com.app.rentmap.repository.PropertyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class PropertyService {
    private final PropertyRepository propertyRepository;
    private final OwnerRepository ownerRepository;
    private final PropertyMapper propertyMapper;
    private final NotificationService notificationService;

    public PropertyService(PropertyRepository propertyRepository, OwnerRepository ownerRepository,
                          PropertyMapper propertyMapper, NotificationService notificationService) {
        this.propertyRepository = propertyRepository;
        this.ownerRepository = ownerRepository;
        this.propertyMapper = propertyMapper;
        this.notificationService = notificationService;
    }

    @Transactional
    public PropertyDto createProperty(String ownerEmail, PropertyCreateDto dto) {
        Owner owner = ownerRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found"));

        Property property = propertyMapper.toEntity(dto);
        property.setOwner(owner);

        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            List<PropertyImage> images = new ArrayList<>();
            for (int i = 0; i < dto.getImageUrls().size(); i++) {
                PropertyImage image = PropertyImage.builder()
                        .imageUrl(dto.getImageUrls().get(i))
                        .displayOrder(i)
                        .property(property)
                        .build();
                images.add(image);
            }
            property.setImages(images);
        }

        Property saved = propertyRepository.save(property);
        
        notificationService.notifyMatchingTenants(saved);
        
        return propertyMapper.toDto(saved);
    }

    public Page<PropertyDto> getAllProperties(String region, BigDecimal maxPrice, Pageable pageable) {
        Page<Property> properties;
        if (region != null && !region.isEmpty() && maxPrice != null) {
            properties = propertyRepository.findByRegionAndMaxPrice(region, maxPrice, pageable);
        } else if (region != null && !region.isEmpty()) {
            properties = propertyRepository.findByRegion(region, pageable);
        } else if (maxPrice != null) {
            properties = propertyRepository.findByMaxPrice(maxPrice, pageable);
        } else {
            properties = propertyRepository.findAll(pageable);
        }
        return properties.map(propertyMapper::toDto);
    }

    public List<PropertyDto> getAllPropertiesForMap() {
        List<Property> properties = propertyRepository.findAll();
        return properties.stream().map(propertyMapper::toDto).toList();
    }

    public PropertyDto getPropertyById(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        return propertyMapper.toDto(property);
    }

    public List<PropertyDto> getPropertiesByOwner(String ownerEmail) {
        Owner owner = ownerRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found"));
        List<Property> properties = propertyRepository.findByOwnerId(owner.getId());
        return properties.stream().map(propertyMapper::toDto).toList();
    }
}

