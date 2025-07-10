import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";

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
  const query = useQuery({
    queryKey: ["/api/rooms", roomId, "messages"],
    enabled: !!roomId,
    refetchInterval: 2000, // Poll every 2 seconds for new messages
  });

  return query;
}

export function useDirectMessages(userId: number | null) {
  return useQuery({
    queryKey: ["/api/direct", userId, "messages"],
    enabled: !!userId,
    refetchInterval: 2000,
  });
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
  return useQuery({
    queryKey: ["/api/friends/requests"],
  });
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
