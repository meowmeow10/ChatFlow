import { useState } from "react";
import { MoreVertical, Edit, Trash2, X, Check } from "lucide-react";
import type { Message } from "@/hooks/use-chat";
import { MessageAttachment } from "./message-attachment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useEditMessage, useDeleteMessage } from "@/hooks/use-chat";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      try {
        await editMessage.mutateAsync({
          messageId: message.id,
          content: editContent.trim()
        });
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    } else {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage.mutateAsync(message.id);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  if (isOwn) {
    return (
      <div className="flex items-start space-x-3 flex-row-reverse">
        {message.sender.profilePicture ? (
          <img 
            src={message.sender.profilePicture} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-10 h-10 avatar-gradient">
            {getInitials(message.sender.displayName)}
          </div>
        )}
        <div className="flex-1 max-w-lg">
          <div className="flex items-center space-x-2 mb-1 justify-end">
            <span className="text-xs text-muted-foreground">
              {formatTime(message.createdAt)}
              {message.isEdited && " (edited)"}
            </span>
            <span className="font-medium text-foreground">You</span>
            {isOwn && !message.isDeleted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="message-bubble message-bubble-outgoing">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] text-primary-foreground bg-primary/10 border-primary/20"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleEdit} disabled={editMessage.isPending}>
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {message.messageType === 'text' ? (
                  <p className={`text-primary-foreground ${message.isDeleted ? 'italic opacity-60' : ''}`}>
                    {message.content}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {message.content && (
                      <p className={`text-primary-foreground ${message.isDeleted ? 'italic opacity-60' : ''}`}>
                        {message.content}
                      </p>
                    )}
                    {message.fileUrl && !message.isDeleted && (
                      <MessageAttachment
                        fileName={message.fileName || 'Unknown file'}
                        fileUrl={message.fileUrl}
                        fileSize={message.fileSize || 0}
                        mimeType={message.mimeType || 'application/octet-stream'}
                        messageType={message.messageType}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3">
      {message.sender.profilePicture ? (
        <img
          src={message.sender.profilePicture}
          alt={message.sender.displayName}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 avatar-gradient">
          {getInitials(message.sender.displayName)}
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-foreground">
            {message.sender.displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
            {message.isEdited && " (edited)"}
          </span>
        </div>
        <div className="message-bubble message-bubble-incoming">
          {message.messageType === 'text' ? (
            <p className={`text-card-foreground ${message.isDeleted ? 'italic opacity-60' : ''}`}>
              {message.content}
            </p>
          ) : (
            <div className="space-y-2">
              {message.content && (
                <p className={`text-card-foreground ${message.isDeleted ? 'italic opacity-60' : ''}`}>
                  {message.content}
                </p>
              )}
              {message.fileUrl && !message.isDeleted && (
                <MessageAttachment
                  fileName={message.fileName || 'Unknown file'}
                  fileUrl={message.fileUrl}
                  fileSize={message.fileSize || 0}
                  mimeType={message.mimeType || 'application/octet-stream'}
                  messageType={message.messageType}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
