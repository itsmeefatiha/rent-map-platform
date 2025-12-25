package com.app.rentmap.service;

import com.app.rentmap.dto.MessageDto;
import com.app.rentmap.entity.Message;
import com.app.rentmap.entity.User;
import com.app.rentmap.mapper.MessageMapper;
import com.app.rentmap.repository.MessageRepository;
import com.app.rentmap.repository.OwnerRepository;
import com.app.rentmap.repository.TenantRepository;
import com.app.rentmap.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final OwnerRepository ownerRepository;
    private final TenantRepository tenantRepository;
    private final MessageMapper messageMapper;

    public MessageService(MessageRepository messageRepository,
                         UserRepository userRepository,
                         OwnerRepository ownerRepository,
                         TenantRepository tenantRepository,
                         MessageMapper messageMapper) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.ownerRepository = ownerRepository;
        this.tenantRepository = tenantRepository;
        this.messageMapper = messageMapper;
    }

    @Transactional
    public MessageDto sendMessage(String senderEmail, String senderRole, Long receiverId, String content) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + senderEmail));
        
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .read(false)
                .build();
        
        return messageMapper.toDto(messageRepository.save(message));
    }

    public List<MessageDto> getConversation(String userEmail, String userRole, Long otherUserId) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));
        
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Other user not found"));

        List<Message> messages = messageRepository.findConversation(currentUser.getId(), otherUser.getId());
        return messages.stream().map(messageMapper::toDto).collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setRead(true);
        messageRepository.save(message);
    }

    @Transactional
    public void markConversationAsRead(String userEmail, String userRole, Long otherUserId) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));
        
        List<Message> unreadMessages = messageRepository.findConversation(currentUser.getId(), otherUserId)
                .stream()
                .filter(m -> !m.getRead() && m.getReceiver().getId().equals(currentUser.getId()))
                .collect(Collectors.toList());
        
        unreadMessages.forEach(m -> m.setRead(true));
        messageRepository.saveAll(unreadMessages);
    }

    public List<MessageDto> getConversations(String userEmail, String userRole) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));
        
        List<Message> allMessages = messageRepository.findDistinctConversationsByUser(currentUser.getId());
        
        Map<Long, Message> latestMessages = new HashMap<>();
        for (Message msg : allMessages) {
            Long otherUserId = msg.getSender().getId().equals(currentUser.getId()) 
                    ? msg.getReceiver().getId() 
                    : msg.getSender().getId();
            
            if (!latestMessages.containsKey(otherUserId) || 
                msg.getCreatedAt().isAfter(latestMessages.get(otherUserId).getCreatedAt())) {
                latestMessages.put(otherUserId, msg);
            }
        }
        
        return latestMessages.values().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(messageMapper::toDto)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(String userEmail, String userRole) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));
        
        Long count = messageRepository.countUnreadMessagesForUser(currentUser.getId());
        return count != null ? count : 0L;
    }

    public long getUnreadCountForConversation(String userEmail, String userRole, Long otherUserId) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));
        
        Long count = messageRepository.countUnreadMessagesInConversation(currentUser.getId(), otherUserId);
        return count != null ? count : 0L;
    }
}
