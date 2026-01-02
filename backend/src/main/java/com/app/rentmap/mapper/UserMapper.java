package com.app.rentmap.mapper;

import com.app.rentmap.dto.UserDto;
import com.app.rentmap.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User user);
}



