package com.app.rentmap.repository;

import com.app.rentmap.entity.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    
    Optional<MessageReaction> findByMessageIdAndUserId(Long messageId, Long userId);
    
    List<MessageReaction> findByMessageId(Long messageId);
    
    @Query("SELECT mr.emoji, COUNT(mr) FROM MessageReaction mr WHERE mr.message.id = :messageId GROUP BY mr.emoji")
    List<Object[]> countReactionsByEmoji(@Param("messageId") Long messageId);
    
    void deleteByMessageIdAndUserId(Long messageId, Long userId);
}



