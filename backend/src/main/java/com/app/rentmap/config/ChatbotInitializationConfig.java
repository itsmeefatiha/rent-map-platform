package com.app.rentmap.config;

import com.app.rentmap.entity.Tenant;
import com.app.rentmap.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ChatbotInitializationConfig {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostConstruct
    public void initializeChatbot() {
        try {
            // Check if chatbot user already exists
            if (userRepository.findByEmail("chatbot@rentmap.com").isEmpty()) {
                log.info("Creating chatbot user...");
                
                // Create chatbot as a Tenant (so it can be used in conversations)
                Tenant chatbot = Tenant.builder()
                        .email("chatbot@rentmap.com")
                        .password(passwordEncoder.encode("chatbot_secure_password_12345"))
                        .firstName("Assistant")
                        .lastName("Virtuel")
                        .role("CHATBOT")
                        .bio("Je suis votre assistant virtuel pour vous aider à trouver la propriété de location idéale.")
                        .build();
                
                userRepository.save(chatbot);
                log.info("Chatbot user created successfully with ID: {}", chatbot.getId());
            } else {
                log.debug("Chatbot user already exists");
            }
        } catch (Exception e) {
            log.error("Error initializing chatbot user: {}", e.getMessage(), e);
            // Don't throw exception to allow application to start
        }
    }
}

