import type { Message } from "@/hooks/use-chat";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
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

  if (isOwn) {
    return (
      <div className="flex items-start space-x-3 flex-row-reverse">
        <div className="w-10 h-10 avatar-gradient">
          {getInitials(message.sender.displayName)}
        </div>
        <div className="flex-1 max-w-lg">
          <div className="flex items-center space-x-2 mb-1 justify-end">
            <span className="text-xs text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
            <span className="font-medium text-foreground">You</span>
          </div>
          <div className="message-bubble message-bubble-outgoing">
            <p className="text-primary-foreground">{message.content}</p>
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
          </span>
        </div>
        <div className="message-bubble message-bubble-incoming">
          <p className="text-card-foreground">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
