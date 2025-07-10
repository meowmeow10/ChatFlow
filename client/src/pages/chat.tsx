import { useState } from "react";
import { MessageCircle, Mail, Users, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { RoomInfo } from "@/components/chat/room-info";
import { CreateRoomModal } from "@/components/modals/create-room-modal";
import { SettingsModal } from "@/components/modals/settings-modal";

export default function Chat() {
  const isMobile = useIsMobile();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [activeDirectMessageUserId, setActiveDirectMessageUserId] = useState<number | null>(null);
  const [sidebarView, setSidebarView] = useState<"rooms" | "direct" | "buddies">("rooms");
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleSelectRoom = (roomId: number) => {
    setActiveRoomId(roomId);
    setActiveDirectMessageUserId(null);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleSelectDirectMessage = (userId: number) => {
    setActiveDirectMessageUserId(userId);
    setActiveRoomId(null);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-50 transform transition-transform ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative'
      } w-80 bg-card border-r border-border flex flex-col`}>
        <Sidebar
          activeRoomId={activeRoomId}
          activeDirectMessageUserId={activeDirectMessageUserId}
          currentView={sidebarView}
          onViewChange={setSidebarView}
          onSelectRoom={handleSelectRoom}
          onSelectDirectMessage={handleSelectDirectMessage}
          onCreateRoom={() => setShowCreateRoomModal(true)}
          onShowSettings={() => setShowSettingsModal(true)}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
        />
      </div>

      {/* Mobile overlay */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatArea
          activeRoomId={activeRoomId}
          activeDirectMessageUserId={activeDirectMessageUserId}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          onToggleRoomInfo={() => setShowRoomInfo(!showRoomInfo)}
        />
      </div>

      {/* Right Sidebar (Room Info) */}
      {!isMobile && showRoomInfo && activeRoomId && (
        <div className="w-80 bg-card border-l border-border">
          <RoomInfo roomId={activeRoomId} />
        </div>
      )}

      {/* Modals */}
      <CreateRoomModal
        open={showCreateRoomModal}
        onOpenChange={setShowCreateRoomModal}
      />

      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-30">
          <div className="flex justify-around">
            <button
              onClick={() => {
                setSidebarView("rooms");
                setShowSidebar(true);
              }}
              className={`flex flex-col items-center space-y-1 ${
                sidebarView === "rooms" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Rooms</span>
            </button>
            <button
              onClick={() => {
                setSidebarView("direct");
                setShowSidebar(true);
              }}
              className={`flex flex-col items-center space-y-1 ${
                sidebarView === "direct" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Mail className="w-5 h-5" />
              <span className="text-xs">DMs</span>
            </button>
            <button
              onClick={() => {
                setSidebarView("buddies");
                setShowSidebar(true);
              }}
              className={`flex flex-col items-center space-y-1 ${
                sidebarView === "buddies" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Buddies</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex flex-col items-center space-y-1 text-muted-foreground"
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
