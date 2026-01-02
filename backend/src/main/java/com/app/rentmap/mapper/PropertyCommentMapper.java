package com.app.rentmap.mapper;

import com.app.rentmap.dto.PropertyCommentCreateDto;
import com.app.rentmap.dto.PropertyCommentDto;
import com.app.rentmap.entity.PropertyComment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PropertyCommentMapper {
    @Mapping(target = "propertyId", source = "property.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", expression = "java(comment.getUser().getFirstName() + \" \" + comment.getUser().getLastName())")
    @Mapping(target = "userEmail", source = "user.email")
    @Mapping(target = "parentCommentId", source = "parentComment.id")
    @Mapping(target = "likeCount", ignore = true)
    @Mapping(target = "isLikedByCurrentUser", ignore = true)
    @Mapping(target = "replies", ignore = true)
    PropertyCommentDto toDto(PropertyComment comment);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "property", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "parentComment", ignore = true)
    @Mapping(target = "replies", ignore = true)
    @Mapping(target = "likes", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    PropertyComment toEntity(PropertyCommentCreateDto dto);
}

