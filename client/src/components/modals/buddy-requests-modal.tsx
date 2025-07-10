
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { Check, X, User } from "lucide-react";

interface BuddyRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BuddyRequestsModal({ isOpen, onClose }: BuddyRequestsModalProps) {
  const { data: friendRequests, isLoading } = useFriendRequests();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAccept = async (requestId: number) => {
    try {
      await acceptRequest.mutateAsync(requestId);
      toast({
        title: "Success",
        description: "Buddy request accepted!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept buddy request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectRequest.mutateAsync(requestId);
      toast({
        title: "Success",
        description: "Buddy request rejected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject buddy request",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Buddy Requests
            {friendRequests && friendRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {friendRequests.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading requests...</p>
            </div>
          )}
          
          {!isLoading && (!friendRequests || friendRequests.length === 0) && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No buddy requests</p>
            </div>
          )}

          {friendRequests && friendRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {request.requester.profilePicture ? (
                    <img 
                      src={request.requester.profilePicture} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 avatar-gradient text-sm font-medium">
                      {getInitials(request.requester.displayName)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{request.requester.displayName}</p>
                  <p className="text-sm text-muted-foreground">wants to be your buddy</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleAccept(request.id)}
                  disabled={acceptRequest.isPending || rejectRequest.isPending}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleReject(request.id)}
                  disabled={acceptRequest.isPending || rejectRequest.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
