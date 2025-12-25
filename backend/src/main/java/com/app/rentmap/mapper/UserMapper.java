package com.app.rentmap.mapper;

import com.app.rentmap.dto.UserDto;
import com.app.rentmap.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User user);
}

