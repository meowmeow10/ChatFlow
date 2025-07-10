import { Link, Cog, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoom, useRoomMembers, useGenerateInvite } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";

interface RoomInfoProps {
  roomId: number;
}

export function RoomInfo({ roomId }: RoomInfoProps) {
  const { data: room } = useRoom(roomId);
  const { data: members, isLoading: membersLoading } = useRoomMembers(roomId);
  const generateInviteMutation = useGenerateInvite();
  const { toast } = useToast();

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

  const handleGenerateInvite = async () => {
    try {
      const result = await generateInviteMutation.mutateAsync(roomId);
      const inviteUrl = `${window.location.origin}/join/${result.inviteCode}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Invite link copied!",
        description: "Share this link to invite others to the room.",
      });
    } catch (error) {
      toast({
        title: "Failed to generate invite",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!room) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading room info...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Room Information</h3>
      
      {/* Room Details */}
      <div className="mb-6">
        <div className="w-16 h-16 avatar-gradient mx-auto mb-4 text-2xl font-bold">
          {getInitials(room.name)}
        </div>
        <h4 className="text-center font-medium text-foreground">{room.name}</h4>
        {room.description && (
          <p className="text-center text-sm text-muted-foreground mt-1">
            {room.description}
          </p>
        )}
      </div>

      {/* Room Actions */}
      <div className="space-y-3 mb-6">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleGenerateInvite}
          disabled={generateInviteMutation.isPending}
        >
          <Link className="w-4 h-4 mr-3 text-primary" />
          <span>Generate Invite Link</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <Cog className="w-4 h-4 mr-3 text-primary" />
          <span>Room Settings</span>
        </Button>
      </div>

      {/* Members List */}
      <div>
        <h5 className="font-medium text-foreground mb-3">
          Members ({members?.length || 0})
        </h5>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {membersLoading ? (
            <div className="text-center text-muted-foreground">Loading members...</div>
          ) : members && members.length > 0 ? (
            members.map((member) => (
              <div key={member.id} className="flex items-center space-x-3">
                {member.user.profilePicture ? (
                  <img
                    src={member.user.profilePicture}
                    alt={member.user.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 avatar-gradient text-sm">
                    {getInitials(member.user.displayName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {member.user.displayName}
                    {member.role === "admin" && (
                      <span className="ml-2 text-xs text-primary">(Admin)</span>
                    )}
                  </p>
                  <p className="text-sm flex items-center capitalize">
                    <span 
                      className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(member.user.status)}`}
                    />
                    {member.user.status === "online" ? (
                      <span className="text-emerald-500">Online</span>
                    ) : member.user.status === "away" ? (
                      <span className="text-amber-500">Away</span>
                    ) : (
                      <span className="text-muted-foreground">
                        Last seen {new Date(member.user.lastSeen || "").toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground">No members found</div>
          )}
        </div>
      </div>
    </div>
  );
}
