package com.app.rentmap.config;

import com.app.rentmap.security.JwtTokenProvider;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    public WebSocketAuthInterceptor(JwtTokenProvider jwtTokenProvider, UserDetailsService userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null) {
            // Handle both CONNECT and SEND commands
            if (StompCommand.CONNECT.equals(accessor.getCommand()) || 
                StompCommand.SEND.equals(accessor.getCommand())) {
                
                List<String> authHeaders = accessor.getNativeHeader("Authorization");
                
                if (authHeaders != null && !authHeaders.isEmpty()) {
                    String authHeader = authHeaders.get(0);
                    
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        
                        if (jwtTokenProvider.validateToken(token)) {
                            String email = jwtTokenProvider.getEmailFromToken(token);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                            Authentication authentication = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            accessor.setUser(authentication);
                        }
                    }
                }
            }
        }
        
        return message;
    }
}

