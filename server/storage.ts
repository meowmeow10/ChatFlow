import { 
  users, 
  rooms, 
  roomMembers, 
  messages, 
  friendships,
  type User, 
  type InsertUser,
  type Room,
  type InsertRoom,
  type Message,
  type InsertMessage,
  type RoomMember,
  type Friendship,
  type InsertFriendship
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserStatus(id: number, status: string): Promise<void>;

  // Room operations
  createRoom(room: InsertRoom, creatorId: number): Promise<Room>;
  getRoomById(id: number): Promise<Room | undefined>;
  getUserRooms(userId: number): Promise<(Room & { lastMessage?: Message; unreadCount: number })[]>;
  getRoomByInviteCode(inviteCode: string): Promise<Room | undefined>;
  generateInviteCode(roomId: number): Promise<string>;
  
  // Room membership
  addRoomMember(roomId: number, userId: number, role?: string): Promise<RoomMember>;
  removeRoomMember(roomId: number, userId: number): Promise<void>;
  getRoomMembers(roomId: number): Promise<(RoomMember & { user: User })[]>;
  isRoomMember(roomId: number, userId: number): Promise<boolean>;

  // Message operations
  createMessage(message: InsertMessage & { senderId: number }): Promise<Message>;
  getRoomMessages(roomId: number, limit?: number): Promise<(Message & { sender: User })[]>;
  getDirectMessages(userId1: number, userId2: number, limit?: number): Promise<(Message & { sender: User })[]>;
  getRecentChats(userId: number): Promise<any[]>;

  // Friendship operations
  createFriendRequest(requesterId: number, addresseeId: number): Promise<Friendship>;
  acceptFriendRequest(requestId: number): Promise<void>;
  rejectFriendRequest(requestId: number): Promise<void>;
  getFriends(userId: number): Promise<User[]>;
  getFriendRequests(userId: number): Promise<(Friendship & { requester: User })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserStatus(id: number, status: string): Promise<void> {
    await db
      .update(users)
      .set({ status, lastSeen: new Date() })
      .where(eq(users.id, id));
  }

  async createRoom(room: InsertRoom, creatorId: number): Promise<Room> {
    const inviteCode = Math.random().toString(36).substring(2, 10);
    const [newRoom] = await db
      .insert(rooms)
      .values({ ...room, createdBy: creatorId, inviteCode })
      .returning();
    
    // Add creator as admin
    await this.addRoomMember(newRoom.id, creatorId, "admin");
    
    return newRoom;
  }

  async getRoomById(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getUserRooms(userId: number): Promise<(Room & { lastMessage?: Message; unreadCount: number })[]> {
    const userRooms = await db
      .select({
        room: rooms,
        lastMessage: messages,
      })
      .from(roomMembers)
      .leftJoin(rooms, eq(roomMembers.roomId, rooms.id))
      .leftJoin(
        messages,
        eq(messages.id, 
          sql`(SELECT id FROM ${messages} WHERE room_id = ${rooms.id} ORDER BY created_at DESC LIMIT 1)`
        )
      )
      .where(eq(roomMembers.userId, userId));

    return userRooms.map(row => ({
      ...row.room!,
      lastMessage: row.lastMessage || undefined,
      unreadCount: 0, // TODO: Implement unread count
    }));
  }

  async getRoomByInviteCode(inviteCode: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.inviteCode, inviteCode));
    return room || undefined;
  }

  async generateInviteCode(roomId: number): Promise<string> {
    const inviteCode = Math.random().toString(36).substring(2, 10);
    await db
      .update(rooms)
      .set({ inviteCode })
      .where(eq(rooms.id, roomId));
    return inviteCode;
  }

  async addRoomMember(roomId: number, userId: number, role: string = "member"): Promise<RoomMember> {
    const [member] = await db
      .insert(roomMembers)
      .values({ roomId, userId, role })
      .returning();
    return member;
  }

  async removeRoomMember(roomId: number, userId: number): Promise<void> {
    await db
      .delete(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)));
  }

  async getRoomMembers(roomId: number): Promise<(RoomMember & { user: User })[]> {
    const members = await db
      .select({
        roomMember: roomMembers,
        user: users,
      })
      .from(roomMembers)
      .leftJoin(users, eq(roomMembers.userId, users.id))
      .where(eq(roomMembers.roomId, roomId));

    return members.map(row => ({
      ...row.roomMember,
      user: row.user!,
    }));
  }

  async isRoomMember(roomId: number, userId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)));
    return !!member;
  }

  async createMessage(message: InsertMessage & { senderId: number }): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getRoomMessages(roomId: number, limit: number = 50): Promise<(Message & { sender: User })[]> {
    const roomMessages = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return roomMessages.map(row => ({
      ...row.message,
      sender: row.sender!,
    })).reverse();
  }

  async getDirectMessages(userId1: number, userId2: number, limit: number = 50): Promise<(Message & { sender: User })[]> {
    const directMessages = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          sql`${messages.roomId} IS NULL`,
          or(
            and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
            and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
          )
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return directMessages.map(row => ({
      ...row.message,
      sender: row.sender!,
    })).reverse();
  }

  async getRecentChats(userId: number): Promise<any[]> {
    // For now, return empty array to avoid complex SQL issues
    // This can be enhanced later with proper subquery handling
    return [];
  }

  async createFriendRequest(requesterId: number, addresseeId: number): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values({ requesterId, addresseeId })
      .returning();
    return friendship;
  }

  async acceptFriendRequest(requestId: number): Promise<void> {
    await db
      .update(friendships)
      .set({ status: "accepted" })
      .where(eq(friendships.id, requestId));
  }

  async rejectFriendRequest(requestId: number): Promise<void> {
    await db
      .update(friendships)
      .set({ status: "rejected" })
      .where(eq(friendships.id, requestId));
  }

  async getFriends(userId: number): Promise<User[]> {
    const friends = await db
      .select({
        user: users,
      })
      .from(friendships)
      .leftJoin(
        users,
        or(
          eq(users.id, friendships.requesterId),
          eq(users.id, friendships.addresseeId)
        )
      )
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          ),
          sql`${users.id} != ${userId}`
        )
      );

    return friends.map(row => row.user!);
  }

  async getFriendRequests(userId: number): Promise<(Friendship & { requester: User })[]> {
    const requests = await db
      .select({
        friendship: friendships,
        requester: users,
      })
      .from(friendships)
      .leftJoin(users, eq(friendships.requesterId, users.id))
      .where(
        and(
          eq(friendships.addresseeId, userId),
          eq(friendships.status, "pending")
        )
      );

    return requests.map(row => ({
      ...row.friendship,
      requester: row.requester!,
    }));
  }
}

export const storage = new DatabaseStorage();
