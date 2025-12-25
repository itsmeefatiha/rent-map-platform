package com.app.rentmap.controller;

import com.app.rentmap.dto.MessageDto;
import com.app.rentmap.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:5173")
public class MessageController {
    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/conversation/{otherUserId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageDto>> getConversation(Authentication authentication,
                                                            @PathVariable Long otherUserId) {
        String email = authentication.getName();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        List<MessageDto> messages = messageService.getConversation(email, role, otherUserId);
        return ResponseEntity.ok(messages);
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        messageService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/conversation/{otherUserId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markConversationAsRead(Authentication authentication,
                                                       @PathVariable Long otherUserId) {
        String email = authentication.getName();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        messageService.markConversationAsRead(email, role, otherUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/conversations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageDto>> getConversations(Authentication authentication) {
        String email = authentication.getName();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        List<MessageDto> conversations = messageService.getConversations(email, role);
        return ResponseEntity.ok(conversations);
    }

    @PostMapping("/send")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageDto> sendMessage(Authentication authentication,
                                                 @RequestBody SendMessageRequest request) {
        String email = authentication.getName();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        
        MessageDto messageDto = messageService.sendMessage(
                email,
                role,
                request.getReceiverId(),
                request.getContent()
        );
        
        return ResponseEntity.ok(messageDto);
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        String email = authentication.getName();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        long count = messageService.getUnreadCount(email, role);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/unread-count/{otherUserId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> getUnreadCountForConversation(Authentication authentication,
                                                               @PathVariable Long otherUserId) {
        String email = authentication.getName();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        long count = messageService.getUnreadCountForConversation(email, role, otherUserId);
        return ResponseEntity.ok(count);
    }

    public static class SendMessageRequest {
        private Long receiverId;
        private String content;

        public Long getReceiverId() {
            return receiverId;
        }

        public void setReceiverId(Long receiverId) {
            this.receiverId = receiverId;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
