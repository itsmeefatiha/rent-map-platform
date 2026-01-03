package com.app.rentmap.service;

import com.app.rentmap.dto.PropertyCreateDto;
import com.app.rentmap.dto.PropertyDto;
import com.app.rentmap.entity.Owner;
import com.app.rentmap.entity.Property;
import com.app.rentmap.entity.PropertyImage;
import com.app.rentmap.mapper.PropertyMapper;
import com.app.rentmap.repository.OwnerRepository;
import com.app.rentmap.repository.PropertyImageRepository;
import com.app.rentmap.repository.PropertyRepository;
import com.app.rentmap.repository.UserInteractionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PropertyService {
    private final PropertyRepository propertyRepository;
    private final OwnerRepository ownerRepository;
    private final PropertyMapper propertyMapper;
    private final PropertyImageRepository propertyImageRepository;
    private final PropertyCommentService propertyCommentService;
    private final UserInteractionRepository userInteractionRepository;

    public PropertyService(PropertyRepository propertyRepository,
                          OwnerRepository ownerRepository,
                          PropertyMapper propertyMapper,
                          PropertyImageRepository propertyImageRepository,
                          PropertyCommentService propertyCommentService,
                          UserInteractionRepository userInteractionRepository) {
        this.propertyRepository = propertyRepository;
        this.ownerRepository = ownerRepository;
        this.propertyMapper = propertyMapper;
        this.propertyImageRepository = propertyImageRepository;
        this.propertyCommentService = propertyCommentService;
        this.userInteractionRepository = userInteractionRepository;
    }

    @Transactional
    public PropertyDto createProperty(String ownerEmail, PropertyCreateDto dto) {
        Owner owner = ownerRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found"));

        Property property = propertyMapper.toEntity(dto);
        property.setOwner(owner);

        Property savedProperty = propertyRepository.save(property);

        // Save images if provided
        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            for (int i = 0; i < dto.getImageUrls().size(); i++) {
                PropertyImage image = PropertyImage.builder()
                        .property(savedProperty)
                        .imageUrl(dto.getImageUrls().get(i))
                        .displayOrder(i)
                        .build();
                propertyImageRepository.save(image);
            }
        }

        return enrichDto(propertyMapper.toDto(savedProperty));
    }

    @Transactional(readOnly = true)
    public Page<PropertyDto> getAllProperties(String region, BigDecimal maxPrice, Pageable pageable) {
        Page<Property> properties;
        
        if (region != null && maxPrice != null) {
            properties = propertyRepository.findByRegionAndMaxPrice(region, maxPrice, pageable);
        } else if (region != null) {
            properties = propertyRepository.findByRegion(region, pageable);
        } else if (maxPrice != null) {
            properties = propertyRepository.findByMaxPrice(maxPrice, pageable);
        } else {
            properties = propertyRepository.findAll(pageable);
        }

        return properties.map(p -> enrichDto(propertyMapper.toDto(p)));
    }

    @Transactional(readOnly = true)
    public List<PropertyDto> getAllPropertiesForMap() {
        List<Property> properties = propertyRepository.findAll();
        return properties.stream()
                .map(p -> enrichDto(propertyMapper.toDto(p)))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PropertyDto getPropertyById(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        return enrichDto(propertyMapper.toDto(property));
    }

    @Transactional(readOnly = true)
    public List<PropertyDto> getPropertiesByOwner(String ownerEmail) {
        Owner owner = ownerRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found"));
        
        List<Property> properties = propertyRepository.findByOwnerId(owner.getId());
        return properties.stream()
                .map(p -> enrichDto(propertyMapper.toDto(p)))
                .collect(Collectors.toList());
    }

    @Transactional
    public PropertyDto updateProperty(String ownerEmail, Long propertyId, PropertyCreateDto dto) {
        Owner owner = ownerRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found"));
        
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        // Vérifier que la propriété appartient au propriétaire
        if (!property.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Unauthorized: You can only update your own properties");
        }
        
        // Mettre à jour les propriétés
        property.setTitle(dto.getTitle());
        property.setDescription(dto.getDescription());
        property.setPrice(dto.getPrice());
        property.setArea(dto.getArea());
        property.setRegion(dto.getRegion());
        property.setLatitude(dto.getLatitude());
        property.setLongitude(dto.getLongitude());
        property.setAvailability(dto.getAvailability());
        property.setNumberOfRooms(dto.getNumberOfRooms());
        property.setNumberOfBedrooms(dto.getNumberOfBedrooms());
        property.setNumberOfBathrooms(dto.getNumberOfBathrooms());
        property.setHasWifi(dto.getHasWifi());
        property.setHasParking(dto.getHasParking());
        property.setHasAirConditioning(dto.getHasAirConditioning());
        property.setHasHeating(dto.getHasHeating());
        property.setHasFurnished(dto.getHasFurnished());
        property.setPetsAllowed(dto.getPetsAllowed());
        property.setPropertyType(dto.getPropertyType());
        property.setRentalPeriod(dto.getRentalPeriod());
        
        Property savedProperty = propertyRepository.save(property);
        
        // Supprimer les anciennes images
        propertyImageRepository.deleteByPropertyId(propertyId);
        
        // Sauvegarder les nouvelles images si fournies
        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            for (int i = 0; i < dto.getImageUrls().size(); i++) {
                PropertyImage image = PropertyImage.builder()
                        .property(savedProperty)
                        .imageUrl(dto.getImageUrls().get(i))
                        .displayOrder(i)
                        .build();
                propertyImageRepository.save(image);
            }
        }
        
        return enrichDto(propertyMapper.toDto(savedProperty));
    }

    @Transactional
    public void deleteProperty(String ownerEmail, Long propertyId) {
        Owner owner = ownerRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found"));
        
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        // Vérifier que la propriété appartient au propriétaire
        if (!property.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Unauthorized: You can only delete your own properties");
        }
        
        // Supprimer les interactions utilisateur liées à cette propriété
        userInteractionRepository.deleteByPropertyId(propertyId);
        
        // La suppression de la propriété supprimera automatiquement en cascade :
        // - PropertyImage (cascade = ALL, orphanRemoval = true)
        // - Favorite (cascade = ALL, orphanRemoval = true)
        // - PropertyComment (cascade = ALL, orphanRemoval = true)
        propertyRepository.delete(property);
    }

    private PropertyDto enrichDto(PropertyDto dto) {
        // Enrich with comments and ratings
        var comments = propertyCommentService.getCommentsByProperty(dto.getId(), null);
        dto.setComments(comments);
        dto.setTotalComments(comments.size());
        dto.setAverageRating(propertyCommentService.getAverageRating(dto.getId()));
        return dto;
    }
}

