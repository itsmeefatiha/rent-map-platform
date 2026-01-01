package com.app.rentmap.websocket;

import com.app.rentmap.dto.MessageDto;
import com.app.rentmap.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

    public ChatController(SimpMessagingTemplate messagingTemplate, MessageService messageService) {
        this.messagingTemplate = messagingTemplate;
        this.messageService = messageService;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage, Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("User not authenticated");
        }

        String senderEmail = principal.getName();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String senderRole = auth != null && auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()
            ? auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "")
            : "USER";

        try {
            MessageDto messageDto = messageService.sendMessage(
                    senderEmail,
                    senderRole,
                    chatMessage.getReceiverId(),
                    chatMessage.getContent(),
                    chatMessage.getFileUrl(),
                    chatMessage.getMessageType() != null ? chatMessage.getMessageType() : "TEXT"
            );
            
            // Add reactions to messageDto
            Map<String, Long> reactions = messageService.getReactionsForMessage(messageDto.getId());
            messageDto.setReactions(reactions);

            // Send to receiver
            messagingTemplate.convertAndSendToUser(
                String.valueOf(chatMessage.getReceiverId()),
                "/queue/messages",
                messageDto
            );

            // Send to sender so they get the saved message with ID (replaces temp message)
            messagingTemplate.convertAndSendToUser(
                String.valueOf(messageDto.getSenderId()),
                "/queue/messages",
                messageDto
            );
        } catch (Exception e) {
            System.err.println("Error sending message via WebSocket: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingMessage typingMessage, Principal principal) {
        if (principal == null) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long senderId = auth != null ? getUserIdFromAuth(auth) : null;
        
        if (senderId == null) return;

        messagingTemplate.convertAndSendToUser(
            String.valueOf(typingMessage.getReceiverId()),
            "/queue/typing",
            new TypingStatus(senderId, typingMessage.isTyping())
        );
    }

    private Long getUserIdFromAuth(Authentication auth) {
        try {
            if (auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                return null;
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public static class ChatMessage {
        private String content;
        private Long receiverId;
        private String fileUrl;
        private String messageType;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public Long getReceiverId() {
            return receiverId;
        }

        public void setReceiverId(Long receiverId) {
            this.receiverId = receiverId;
        }

        public String getFileUrl() {
            return fileUrl;
        }

        public void setFileUrl(String fileUrl) {
            this.fileUrl = fileUrl;
        }

        public String getMessageType() {
            return messageType;
        }

        public void setMessageType(String messageType) {
            this.messageType = messageType;
        }
    }

    public static class TypingMessage {
        private Long receiverId;
        private boolean typing;

        public Long getReceiverId() {
            return receiverId;
        }

        public void setReceiverId(Long receiverId) {
            this.receiverId = receiverId;
        }

        public boolean isTyping() {
            return typing;
        }

        public void setTyping(boolean typing) {
            this.typing = typing;
        }
    }

    public static class TypingStatus {
        private Long userId;
        private boolean typing;

        public TypingStatus(Long userId, boolean typing) {
            this.userId = userId;
            this.typing = typing;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public boolean isTyping() {
            return typing;
        }

        public void setTyping(boolean typing) {
            this.typing = typing;
        }
    }
}
