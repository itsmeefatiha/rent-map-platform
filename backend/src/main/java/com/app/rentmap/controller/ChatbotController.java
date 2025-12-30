package com.app.rentmap.controller;

import com.app.rentmap.dto.MessageDto;
import com.app.rentmap.repository.UserRepository;
import com.app.rentmap.service.ChatbotService;
import com.app.rentmap.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatbotController {
    private final ChatbotService chatbotService;
    private final MessageService messageService;
    private final UserRepository userRepository;

    public ChatbotController(ChatbotService chatbotService, MessageService messageService,
                             UserRepository userRepository) {
        this.chatbotService = chatbotService;
        this.messageService = messageService;
        this.userRepository = userRepository;
    }

    @PostMapping("/message")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<MessageDto> sendMessageToChatbot(
            Authentication authentication,
            @RequestBody ChatbotMessageRequest request) {
        
        String tenantEmail = authentication.getName();
        Long tenantId = userRepository.findByEmail(tenantEmail)
                .map(user -> user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get or create chatbot user
        Long chatbotId = chatbotService.getChatbotUserId();
        if (chatbotId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        // Process the message and get response
        String language = request.getLanguage() != null ? request.getLanguage() : "fr";
        String response = chatbotService.processMessage(request.getMessage(), tenantId, language);
        
        // Save tenant's message
        messageService.sendMessage(
                tenantEmail,
                "TENANT",
                chatbotId,
                request.getMessage()
        );
        
        // Save chatbot's response
        MessageDto chatbotResponse = messageService.sendMessage(
                "chatbot@rentmap.com",
                "CHATBOT",
                tenantId,
                response
        );
        
        return ResponseEntity.ok(chatbotResponse);
    }

    @GetMapping("/user-id")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> getChatbotUserId() {
        Long chatbotId = chatbotService.getChatbotUserId();
        if (chatbotId == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(chatbotId);
    }

    public static class ChatbotMessageRequest {
        private String message;
        private String language;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getLanguage() {
            return language;
        }

        public void setLanguage(String language) {
            this.language = language;
        }
    }
}

