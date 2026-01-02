package com.app.rentmap.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private Long id;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String receiverName;
    private String content;
    private String fileUrl;
    private String messageType; // TEXT, FILE, VOICE
    private Boolean read;
    private LocalDateTime createdAt;
    private Map<String, Long> reactions; // Map<emoji, count>
}
