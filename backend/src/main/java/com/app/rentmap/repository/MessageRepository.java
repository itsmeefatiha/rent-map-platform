package com.app.rentmap.repository;

import com.app.rentmap.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :currentUserId AND m.receiver.id = :otherUserId) OR " +
           "(m.sender.id = :otherUserId AND m.receiver.id = :currentUserId) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("currentUserId") Long currentUserId, 
                                   @Param("otherUserId") Long otherUserId);
    
    @Query("SELECT DISTINCT m FROM Message m WHERE " +
           "(m.sender.id = :userId OR m.receiver.id = :userId) " +
           "ORDER BY m.createdAt DESC")
    List<Message> findDistinctConversationsByUser(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver.id = :userId AND m.read = false")
    Long countUnreadMessagesForUser(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE " +
           "((m.sender.id = :currentUserId AND m.receiver.id = :otherUserId) OR " +
           "(m.sender.id = :otherUserId AND m.receiver.id = :currentUserId)) AND " +
           "m.receiver.id = :currentUserId AND m.read = false")
    Long countUnreadMessagesInConversation(@Param("currentUserId") Long currentUserId,
                                           @Param("otherUserId") Long otherUserId);
}
