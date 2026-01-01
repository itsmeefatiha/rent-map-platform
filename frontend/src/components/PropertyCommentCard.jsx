import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { LikeButton } from './LikeButton';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { propertyCommentsApi } from '../api/propertyComments';

export const PropertyCommentCard = ({ comment, onUpdate, onShowLoginModal }) => {
  const { user } = useAuth();
  const { id: propertyId } = useParams();
  const [isLiked, setIsLiked] = useState(comment.isLikedByCurrentUser || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLike = async () => {
    if (!user) {
      onShowLoginModal && onShowLoginModal();
      return;
    }
    
    const previousState = isLiked;
    setIsLiked(!isLiked);
    setLikeCount(prev => previousState ? prev - 1 : prev + 1);

    try {
      await propertyCommentsApi.toggleLike(propertyId, comment.id);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert on error
      setIsLiked(previousState);
      setLikeCount(prev => previousState ? prev + 1 : prev - 1);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await propertyCommentsApi.createReply(propertyId, comment.id, {
        rating: 5, // Default rating for replies
        comment: replyText
      });
      setReplyText('');
      setShowReplyForm(false);
      onUpdate && onUpdate(); // Refresh comments
    } catch (error) {
      console.error('Failed to submit reply:', error);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 group">
      {/* Avatar - Instagram style */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white font-semibold text-xs ring-2 ring-white dark:ring-gray-800">
          {getInitials(comment.userName)}
        </div>
      </div>

      {/* Content - Instagram style */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <div className="flex-1">
            <span className="font-semibold text-sm text-gray-900 dark:text-white mr-1.5">
              {comment.userName || 'Anonymous'}
            </span>
            {comment.comment && (
              <span className="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap break-words">
                {comment.comment}
              </span>
            )}
          </div>
        </div>

        {/* Rating and Actions */}
        <div className="flex items-center gap-4 mt-1.5">
          {/* Star Rating - only for top-level comments */}
          {!comment.parentCommentId && (
            <div className="flex items-center gap-1">
              <StarRating rating={comment.rating} size="sm" />
            </div>
          )}

          {/* Date */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(comment.createdAt)}
          </span>

          {/* Like button */}
          <div className="flex items-center gap-1.5">
            <LikeButton
              isLiked={isLiked}
              onToggle={handleLike}
              size="sm"
            />
            {likeCount > 0 && (
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {likeCount}
              </span>
            )}
          </div>

          {/* Reply button */}
          <button 
            onClick={() => {
              if (!user) {
                onShowLoginModal && onShowLoginModal();
                return;
              }
              setShowReplyForm(!showReplyForm);
            }}
            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Reply
          </button>
        </div>

        {/* Reply Form */}
        {showReplyForm && user && (
          <form onSubmit={handleReplySubmit} className="mt-3 flex items-start gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add a reply..."
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!replyText.trim() || isSubmitting}
              className="px-3 py-1.5 text-sm font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Post
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReplyForm(false);
                setReplyText('');
              }}
              className="px-3 py-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 ml-6 space-y-0 divide-y divide-gray-200 dark:divide-gray-700 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
            {comment.replies.map((reply) => (
              <PropertyCommentCard 
                key={reply.id} 
                comment={reply} 
                onUpdate={onUpdate}
                onShowLoginModal={onShowLoginModal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

