package com.app.rentmap.mapper;

import com.app.rentmap.dto.ReviewDto;
import com.app.rentmap.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    @Mapping(target = "tenantId", source = "tenant.id")
    @Mapping(target = "tenantName", expression = "java(review.getTenant().getFirstName() + \" \" + review.getTenant().getLastName())")
    @Mapping(target = "ownerId", source = "owner.id")
    ReviewDto toDto(Review review);
}



