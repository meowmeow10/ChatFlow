import { useState } from "react";
import { Plus, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useRooms, useFriends, useRecentChats } from "@/hooks/use-chat";
import type { Room } from "@/hooks/use-chat";

interface SidebarProps {
  activeRoomId: number | null;
  activeDirectMessageUserId: number | null;
  currentView: "rooms" | "direct" | "buddies";
  onViewChange: (view: "rooms" | "direct" | "buddies") => void;
  onSelectRoom: (roomId: number) => void;
  onSelectDirectMessage: (userId: number) => void;
  onCreateRoom: () => void;
  onShowSettings: () => void;
  onToggleSidebar: () => void;
}

export function Sidebar({
  activeRoomId,
  activeDirectMessageUserId,
  currentView,
  onViewChange,
  onSelectRoom,
  onSelectDirectMessage,
  onCreateRoom,
  onShowSettings,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const { data: friends, isLoading: friendsLoading } = useFriends();
  const { data: recentChats, isLoading: chatsLoading } = useRecentChats();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-emerald-500";
      case "away": return "bg-amber-500";
      default: return "bg-slate-400";
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const renderRooms = () => {
    if (roomsLoading) {
      return <div className="p-4 text-center text-muted-foreground">Loading rooms...</div>;
    }

    if (!rooms || rooms.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>No rooms yet</p>
          <p className="text-sm">Create your first room to get started!</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {rooms.map((room: Room) => (
          <div
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`sidebar-item ${
              activeRoomId === room.id ? "sidebar-item-active" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 avatar-gradient text-sm font-medium">
                {getInitials(room.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{room.name}</p>
                {room.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {room.lastMessage.sender.displayName}: {room.lastMessage.content}
                  </p>
                )}
              </div>
              <div className="text-right">
                {room.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {room.unreadCount}
                  </Badge>
                )}
                {room.lastMessage && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(room.lastMessage.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDirectMessages = () => {
    if (chatsLoading) {
      return <div className="p-4 text-center text-muted-foreground">Loading chats...</div>;
    }

    const directChats = recentChats?.filter(chat => chat.type === 'direct') || [];

    if (directChats.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>No direct messages yet</p>
          <p className="text-sm">Start a conversation with your friends!</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {directChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectDirectMessage(chat.id)}
            className={`sidebar-item ${
              activeDirectMessageUserId === chat.id ? "sidebar-item-active" : ""
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 avatar-gradient text-sm font-medium">
                {getInitials(chat.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{chat.name}</p>
                {chat.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.senderName}: {chat.lastMessage}
                  </p>
                )}
              </div>
              <div className="text-right">
                {chat.lastMessageTime && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBuddies = () => {
    if (friendsLoading) {
      return <div className="p-4 text-center text-muted-foreground">Loading friends...</div>;
    }

    if (!friends || friends.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>No friends yet</p>
          <p className="text-sm">Send friend requests to connect with others!</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {friends.map((friend) => (
          <div
            key={friend.id}
            onClick={() => onSelectDirectMessage(friend.id)}
            className="sidebar-item"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 avatar-gradient text-sm font-medium">
                  {getInitials(friend.displayName)}
                </div>
                <span 
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(friend.status)}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{friend.displayName}</p>
                <p className="text-sm text-muted-foreground capitalize">{friend.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* User Profile Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 avatar-gradient">
            {user?.displayName && getInitials(user.displayName)}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{user?.displayName}</h3>
            <p className="text-sm text-emerald-500 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
              Online
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onShowSettings}
              className="p-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="p-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => onViewChange("rooms")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            currentView === "rooms"
              ? "text-primary border-b-2 border-primary bg-secondary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Rooms
        </button>
        <button
          onClick={() => onViewChange("direct")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            currentView === "direct"
              ? "text-primary border-b-2 border-primary bg-secondary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Direct Messages
        </button>
        <button
          onClick={() => onViewChange("buddies")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            currentView === "buddies"
              ? "text-primary border-b-2 border-primary bg-secondary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Buddies
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              {currentView === "rooms" && "Chat Rooms"}
              {currentView === "direct" && "Direct Messages"}
              {currentView === "buddies" && "Your Friends"}
            </h4>
            {currentView === "rooms" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCreateRoom}
                className="p-1"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>

          {currentView === "rooms" && renderRooms()}
          {currentView === "direct" && renderDirectMessages()}
          {currentView === "buddies" && renderBuddies()}
        </div>
      </div>
    </>
  );
}
