package com.app.rentmap.controller;

import com.app.rentmap.dto.MessageDto;
import com.app.rentmap.service.FileStorageService;
import com.app.rentmap.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:5173")
public class MessageController {
    private final MessageService messageService;
    private final FileStorageService fileStorageService;

    public MessageController(MessageService messageService, FileStorageService fileStorageService) {
        this.messageService = messageService;
        this.fileStorageService = fileStorageService;
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

    @PostMapping("/send-file")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageDto> sendFile(Authentication authentication,
                                              @RequestParam("receiverId") Long receiverId,
                                              @RequestParam(value = "content", required = false) String content,
                                              @RequestParam("file") MultipartFile file) {
        String email = authentication.getName();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        
        String fileUrl = fileStorageService.storeFile(file);
        String messageType = "FILE";
        
        MessageDto messageDto = messageService.sendMessage(
                email,
                role,
                receiverId,
                content != null ? content : file.getOriginalFilename(),
                fileUrl,
                messageType
        );
        
        return ResponseEntity.ok(messageDto);
    }

    @PostMapping("/send-voice")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageDto> sendVoice(Authentication authentication,
                                                @RequestParam("receiverId") Long receiverId,
                                                @RequestParam("file") MultipartFile file) {
        String email = authentication.getName();
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        
        String fileUrl = fileStorageService.storeFile(file);
        String messageType = "VOICE";
        
        MessageDto messageDto = messageService.sendMessage(
                email,
                role,
                receiverId,
                "Voice message",
                fileUrl,
                messageType
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

    @PostMapping("/{messageId}/reaction")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> addReaction(Authentication authentication,
                                           @PathVariable Long messageId,
                                           @RequestBody ReactionRequest request) {
        String email = authentication.getName();
        messageService.addReaction(email, messageId, request.getEmoji());
        return ResponseEntity.ok().build();
    }

    public static class ReactionRequest {
        private String emoji;

        public String getEmoji() {
            return emoji;
        }

        public void setEmoji(String emoji) {
            this.emoji = emoji;
        }
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
