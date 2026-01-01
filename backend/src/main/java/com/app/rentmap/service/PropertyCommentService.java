package com.app.rentmap.service;

import com.app.rentmap.dto.PropertyCommentCreateDto;
import com.app.rentmap.dto.PropertyCommentDto;
import com.app.rentmap.entity.CommentLike;
import com.app.rentmap.entity.Property;
import com.app.rentmap.entity.PropertyComment;
import com.app.rentmap.entity.User;
import com.app.rentmap.mapper.PropertyCommentMapper;
import com.app.rentmap.repository.CommentLikeRepository;
import com.app.rentmap.repository.PropertyCommentRepository;
import com.app.rentmap.repository.PropertyRepository;
import com.app.rentmap.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PropertyCommentService {
    private final PropertyCommentRepository propertyCommentRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final PropertyCommentMapper propertyCommentMapper;
    private final CommentLikeRepository commentLikeRepository;

    public PropertyCommentService(PropertyCommentRepository propertyCommentRepository,
                                  PropertyRepository propertyRepository,
                                  UserRepository userRepository,
                                  PropertyCommentMapper propertyCommentMapper,
                                  CommentLikeRepository commentLikeRepository) {
        this.propertyCommentRepository = propertyCommentRepository;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
        this.propertyCommentMapper = propertyCommentMapper;
        this.commentLikeRepository = commentLikeRepository;
    }

    @Transactional
    public PropertyCommentDto createComment(String userEmail, Long propertyId, PropertyCommentCreateDto dto) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        PropertyComment comment = propertyCommentMapper.toEntity(dto);
        comment.setProperty(property);
        comment.setUser(user);

        // Si c'est une réponse à un commentaire
        if (dto.getParentCommentId() != null) {
            PropertyComment parentComment = propertyCommentRepository.findById(dto.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setParentComment(parentComment);
        }

        PropertyComment saved = propertyCommentRepository.save(comment);
        return toDtoWithLikes(saved, user.getId());
    }

    public List<PropertyCommentDto> getCommentsByProperty(Long propertyId, Long currentUserId) {
        List<PropertyComment> comments = propertyCommentRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId)
                .stream()
                .filter(c -> c.getParentComment() == null) // Only top-level comments
                .collect(Collectors.toList());
        
        return comments.stream()
                .map(comment -> toDtoWithLikes(comment, currentUserId))
                .collect(Collectors.toList());
    }

    private PropertyCommentDto toDtoWithLikes(PropertyComment comment, Long currentUserId) {
        PropertyCommentDto dto = propertyCommentMapper.toDto(comment);
        
        // Set like count
        long likeCount = commentLikeRepository.countByCommentId(comment.getId());
        dto.setLikeCount((int) likeCount);
        
        // Check if current user liked this comment
        if (currentUserId != null) {
            boolean isLiked = commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), currentUserId);
            dto.setIsLikedByCurrentUser(isLiked);
        }
        
        // Set parent comment ID
        if (comment.getParentComment() != null) {
            dto.setParentCommentId(comment.getParentComment().getId());
        }
        
        // Set replies
        if (comment.getReplies() != null && !comment.getReplies().isEmpty()) {
            List<PropertyCommentDto> replies = comment.getReplies().stream()
                    .map(reply -> toDtoWithLikes(reply, currentUserId))
                    .collect(Collectors.toList());
            dto.setReplies(replies);
        }
        
        return dto;
    }

    public List<PropertyCommentDto> getCommentsByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        List<PropertyComment> comments = propertyCommentRepository.findByUserId(user.getId());
        return comments.stream()
                .map(comment -> toDtoWithLikes(comment, user.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void toggleLike(String userEmail, Long commentId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        PropertyComment comment = propertyCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        var existingLike = commentLikeRepository.findByCommentIdAndUserId(commentId, user.getId());
        
        if (existingLike.isPresent()) {
            commentLikeRepository.delete(existingLike.get());
        } else {
            CommentLike like = CommentLike.builder()
                    .comment(comment)
                    .user(user)
                    .build();
            commentLikeRepository.save(like);
        }
    }

    public Double getAverageRating(Long propertyId) {
        List<PropertyComment> comments = propertyCommentRepository.findByPropertyId(propertyId);
        if (comments.isEmpty()) {
            return null;
        }
        return comments.stream()
                .mapToInt(PropertyComment::getRating)
                .average()
                .orElse(0.0);
    }
}

