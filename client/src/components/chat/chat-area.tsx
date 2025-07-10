import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Info, UserPlus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useRoom, useRoomMessages, useDirectMessages, useSendMessage, useSendDirectMessage } from "@/hooks/use-chat";
import { MessageBubble } from "./message-bubble";
import { FileUpload } from "./file-upload";
import type { Message } from "@/hooks/use-chat";
import type { FileData } from "@/lib/fileUtils";

interface ChatAreaProps {
  activeRoomId: number | null;
  activeDirectMessageUserId: number | null;
  onToggleSidebar: () => void;
  onToggleRoomInfo: () => void;
}

export function ChatArea({
  activeRoomId,
  activeDirectMessageUserId,
  onToggleSidebar,
  onToggleRoomInfo,
}: ChatAreaProps) {
  const { user } = useAuth();
  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: room } = useRoom(activeRoomId);
  const { data: roomMessages, isLoading: roomMessagesLoading } = useRoomMessages(activeRoomId);
  const { data: directMessages, isLoading: directMessagesLoading } = useDirectMessages(activeDirectMessageUserId);
  
  const sendMessageMutation = useSendMessage();
  const sendDirectMessageMutation = useSendDirectMessage();

  const messages = activeRoomId ? roomMessages : directMessages;
  const isLoading = activeRoomId ? roomMessagesLoading : directMessagesLoading;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageContent.trim()) return;

    try {
      if (activeRoomId) {
        await sendMessageMutation.mutateAsync({
          roomId: activeRoomId,
          content: messageContent.trim(),
        });
      } else if (activeDirectMessageUserId) {
        await sendDirectMessageMutation.mutateAsync({
          userId: activeDirectMessageUserId,
          content: messageContent.trim(),
        });
      }
      setMessageContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleFileSelect = async (fileData: FileData) => {
    try {
      const messageType = fileData.mimeType.startsWith('image/') ? 'image' : 'file';
      
      if (activeRoomId) {
        await sendMessageMutation.mutateAsync({
          roomId: activeRoomId,
          content: fileData.fileName, // Use filename as content for file messages
          messageType,
          fileName: fileData.fileName,
          fileUrl: fileData.fileUrl,
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
        });
      } else if (activeDirectMessageUserId) {
        await sendDirectMessageMutation.mutateAsync({
          userId: activeDirectMessageUserId,
          content: fileData.fileName,
          messageType,
          fileName: fileData.fileName,
          fileUrl: fileData.fileUrl,
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
        });
      }
    } catch (error) {
      console.error("Failed to send file:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!activeRoomId && !activeDirectMessageUserId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to ChatFlow</h2>
          <p className="text-muted-foreground">Select a room or start a direct message to begin chatting</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const chatTitle = activeRoomId 
    ? room?.name || "Loading..."
    : activeDirectMessageUserId 
      ? `Direct Message` // TODO: Get user name
      : "Chat";

  const chatSubtitle = activeRoomId 
    ? `Room • ${room?.description || ""}`
    : "Direct Message";

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 avatar-gradient">
              {chatTitle && getInitials(chatTitle)}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{chatTitle}</h2>
              <p className="text-sm text-muted-foreground">{chatSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {activeRoomId && (
              <>
                <Button size="sm" variant="ghost" onClick={onToggleRoomInfo}>
                  <Info className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <UserPlus className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={onToggleSidebar} className="md:hidden">
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading messages...</div>
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {/* Date Separator */}
            <div className="flex items-center justify-center">
              <div className="bg-muted px-3 py-1 rounded-full">
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
            </div>

            {messages.map((message: Message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="chat-input pr-12 min-h-[44px] max-h-32"
                rows={1}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute right-3 top-3"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FileUpload
              onFileSelect={handleFileSelect}
              disabled={sendMessageMutation.isPending || sendDirectMessageMutation.isPending}
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              disabled={!messageContent.trim() || sendMessageMutation.isPending || sendDirectMessageMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
