package com.app.rentmap.mapper;

import com.app.rentmap.dto.MessageDto;
import com.app.rentmap.entity.Message;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MessageMapper {
    @Mapping(target = "senderId", source = "sender.id")
    @Mapping(target = "senderName", expression = "java(message.getSender().getFirstName() + \" \" + message.getSender().getLastName())")
    @Mapping(target = "receiverId", source = "receiver.id")
    @Mapping(target = "receiverName", expression = "java(message.getReceiver().getFirstName() + \" \" + message.getReceiver().getLastName())")
    MessageDto toDto(Message message);
}
