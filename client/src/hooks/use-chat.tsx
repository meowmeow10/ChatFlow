import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useRef } from "react";
import { dmSound, friendRequestSound } from "@/lib/notifications";

export interface Room {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  inviteCode?: string;
  createdBy: number;
  lastMessage?: Message;
  unreadCount: number;
}

export interface Message {
  id: number;
  content: string;
  senderId: number;
  roomId?: number;
  recipientId?: number;
  messageType: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  isEdited: boolean;
  isDeleted: boolean;
  editedAt?: string;
  createdAt: string;
  sender: {
    id: number;
    displayName: string;
    profilePicture?: string;
    status: string;
  };
}

export interface RoomMember {
  id: number;
  roomId: number;
  userId: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    displayName: string;
    profilePicture?: string;
    status: string;
  };
}

export function useRooms() {
  return useQuery({
    queryKey: ["/api/rooms"],
  });
}

export function useRoom(roomId: number | null) {
  return useQuery({
    queryKey: ["/api/rooms", roomId],
    enabled: !!roomId,
  });
}

export function useRoomMembers(roomId: number | null) {
  return useQuery({
    queryKey: ["/api/rooms", roomId, "members"],
    enabled: !!roomId,
  });
}

export function useRoomMessages(roomId: number | null) {
  const previousMessageCount = useRef<number>(0);
  
  const query = useQuery({
    queryKey: ["/api/rooms", roomId, "messages"],
    enabled: !!roomId,
    refetchInterval: 2000, // Poll every 2 seconds for new messages
  });

  useEffect(() => {
    if (query.data && Array.isArray(query.data)) {
      const currentMessageCount = query.data.length;
      
      // Play sound if new messages arrived (but not on initial load)
      if (previousMessageCount.current > 0 && currentMessageCount > previousMessageCount.current) {
        dmSound.play();
      }
      
      previousMessageCount.current = currentMessageCount;
    }
  }, [query.data]);

  return query;
}

export function useDirectMessages(userId: number | null) {
  const previousMessageCount = useRef<number>(0);
  
  const query = useQuery({
    queryKey: ["/api/direct", userId, "messages"],
    enabled: !!userId,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (query.data && Array.isArray(query.data)) {
      const currentMessageCount = query.data.length;
      
      // Play sound if new messages arrived (but not on initial load)
      if (previousMessageCount.current > 0 && currentMessageCount > previousMessageCount.current) {
        dmSound.play();
      }
      
      previousMessageCount.current = currentMessageCount;
    }
  }, [query.data]);

  return query;
}

export function useRecentChats() {
  return useQuery({
    queryKey: ["/api/chats"],
    refetchInterval: 5000,
  });
}

export function useFriends() {
  return useQuery({
    queryKey: ["/api/friends"],
  });
}

export function useFriendRequests() {
  const previousRequestCount = useRef<number>(0);
  
  const query = useQuery({
    queryKey: ["/api/friends/requests"],
  });

  useEffect(() => {
    if (query.data && Array.isArray(query.data)) {
      const currentRequestCount = query.data.length;
      
      // Play sound if new friend requests arrived (but not on initial load)
      if (previousRequestCount.current > 0 && currentRequestCount > previousRequestCount.current) {
        friendRequestSound.play();
      }
      
      previousRequestCount.current = currentRequestCount;
    }
  }, [query.data]);

  return query;
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomData: { name: string; description?: string; isPrivate: boolean }) => {
      const response = await apiRequest("POST", "/api/rooms", roomData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      roomId, 
      content,
      messageType = 'text',
      fileName,
      fileUrl,
      fileSize,
      mimeType
    }: { 
      roomId: number; 
      content: string;
      messageType?: string;
      fileName?: string;
      fileUrl?: string;
      fileSize?: number;
      mimeType?: string;
    }) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/messages`, {
        content,
        messageType,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
      });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/rooms", variables.roomId, "messages"] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
  });
}

export function useSendDirectMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      content,
      messageType = 'text',
      fileName,
      fileUrl,
      fileSize,
      mimeType
    }: { 
      userId: number; 
      content: string;
      messageType?: string;
      fileName?: string;
      fileUrl?: string;
      fileSize?: number;
      mimeType?: string;
    }) => {
      const response = await apiRequest("POST", `/api/direct/${userId}/messages`, {
        content,
        messageType,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
      });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/direct", variables.userId, "messages"] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { messageId: number; content: string }) => {
      const response = await apiRequest("PUT", `/api/messages/${data.messageId}`, { content: data.content });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", null, "messages"] }); // Invalidate room messages
      queryClient.invalidateQueries({ queryKey: ["/api/direct", null, "messages"] }); // Invalidate direct messages
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("DELETE", `/api/messages/${messageId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", null, "messages"] }); // Invalidate room messages
      queryClient.invalidateQueries({ queryKey: ["/api/direct", null, "messages"] }); // Invalidate direct messages
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiRequest("POST", `/api/rooms/join/${inviteCode}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
  });
}

export function useGenerateInvite() {
  return useMutation({
    mutationFn: async (roomId: number) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/invite`);
      return await response.json();
    },
  });
}

export function useAddRoomMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, email }: { roomId: number; email: string }) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/members`, { email });
      return await response.json();
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/friends/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("PUT", `/api/friends/requests/${requestId}/accept`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("PUT", `/api/friends/requests/${requestId}/reject`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
  });
}