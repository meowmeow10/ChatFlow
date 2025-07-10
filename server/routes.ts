import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertRoomSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    
    // Update user status to online
    await storage.updateUserStatus(decoded.userId, "online");
    
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        status: "online",
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          status: user.status,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update user status
      await storage.updateUserStatus(user.id, "online");

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          status: user.status,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: any, res) => {
    try {
      await storage.updateUserStatus(req.userId, "offline");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // User routes
  app.get("/api/user/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        statusMessage: user.statusMessage,
        status: user.status,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.put("/api/user/me", authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.userId, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        statusMessage: user.statusMessage,
        status: user.status,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Room routes
  app.get("/api/rooms", authenticateToken, async (req: any, res) => {
    try {
      const rooms = await storage.getUserRooms(req.userId);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rooms" });
    }
  });

  app.post("/api/rooms", authenticateToken, async (req: any, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData, req.userId);
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.get("/api/rooms/:id", authenticateToken, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      
      // Check if user is a member
      const isMember = await storage.isRoomMember(roomId, req.userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this room" });
      }

      const room = await storage.getRoomById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to get room" });
    }
  });

  app.post("/api/rooms/:id/join", authenticateToken, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      
      // Check if already a member
      const isMember = await storage.isRoomMember(roomId, req.userId);
      if (isMember) {
        return res.status(400).json({ message: "Already a member" });
      }

      await storage.addRoomMember(roomId, req.userId);
      res.json({ message: "Joined room successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.post("/api/rooms/join/:inviteCode", authenticateToken, async (req: any, res) => {
    try {
      const { inviteCode } = req.params;
      
      const room = await storage.getRoomByInviteCode(inviteCode);
      if (!room) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      // Check if already a member
      const isMember = await storage.isRoomMember(room.id, req.userId);
      if (isMember) {
        return res.status(400).json({ message: "Already a member" });
      }

      await storage.addRoomMember(room.id, req.userId);
      res.json({ room, message: "Joined room successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.get("/api/rooms/:id/members", authenticateToken, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      
      const isMember = await storage.isRoomMember(roomId, req.userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this room" });
      }

      const members = await storage.getRoomMembers(roomId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to get room members" });
    }
  });

  app.post("/api/rooms/:id/invite", authenticateToken, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      
      const isMember = await storage.isRoomMember(roomId, req.userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this room" });
      }

      const inviteCode = await storage.generateInviteCode(roomId);
      res.json({ inviteCode });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate invite code" });
    }
  });

  app.post("/api/rooms/:id/members", authenticateToken, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user is a member (and later we can check if admin)
      const isMember = await storage.isRoomMember(roomId, req.userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this room" });
      }

      // Find user by email
      const userToAdd = await storage.getUserByEmail(email);
      if (!userToAdd) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already a member
      const isAlreadyMember = await storage.isRoomMember(roomId, userToAdd.id);
      if (isAlreadyMember) {
        return res.status(400).json({ message: "User is already a member" });
      }

      // Add user to room
      await storage.addRoomMember(roomId, userToAdd.id);
      res.json({ message: "User added to room successfully", user: { id: userToAdd.id, displayName: userToAdd.displayName, email: userToAdd.email } });
    } catch (error) {
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  // Message routes
  app.get("/api/rooms/:id/messages", authenticateToken, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      
      const isMember = await storage.isRoomMember(roomId, req.userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this room" });
      }

      const messages = await storage.getRoomMessages(roomId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/rooms/:id/messages", authenticateToken, async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.id);
      
      const isMember = await storage.isRoomMember(roomId, req.userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this room" });
      }

      const messageData = insertMessageSchema.parse({ ...req.body, roomId });
      const message = await storage.createMessage({
        ...messageData,
        senderId: req.userId,
      });

      // Get the message with sender info
      const messageWithSender = await storage.getRoomMessages(roomId, 1);
      res.status(201).json(messageWithSender[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Direct message routes
  app.get("/api/direct/:userId/messages", authenticateToken, async (req: any, res) => {
    try {
      const otherUserId = parseInt(req.params.userId);
      const messages = await storage.getDirectMessages(req.userId, otherUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get direct messages" });
    }
  });

  app.post("/api/direct/:userId/messages", authenticateToken, async (req: any, res) => {
    try {
      const recipientId = parseInt(req.params.userId);
      const messageData = insertMessageSchema.parse({
        ...req.body,
        recipientId,
        roomId: null,
      });

      const message = await storage.createMessage({
        ...messageData,
        senderId: req.userId,
      });

      // Get the message with sender info
      const messageWithSender = await storage.getDirectMessages(req.userId, recipientId, 1);
      res.status(201).json(messageWithSender[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to send direct message" });
    }
  });

  // Edit message
  app.put("/api/messages/:id", authenticateToken, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Check if user owns the message
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      if (message.senderId !== req.userId) {
        return res.status(403).json({ message: "You can only edit your own messages" });
      }

      if (message.isDeleted) {
        return res.status(400).json({ message: "Cannot edit deleted message" });
      }

      const updatedMessage = await storage.editMessage(messageId, content);
      res.json(updatedMessage);
    } catch (error) {
      res.status(500).json({ message: "Failed to edit message" });
    }
  });

  // Delete message
  app.delete("/api/messages/:id", authenticateToken, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);

      // Check if user owns the message
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      if (message.senderId !== req.userId) {
        return res.status(403).json({ message: "You can only delete your own messages" });
      }

      if (message.isDeleted) {
        return res.status(400).json({ message: "Message already deleted" });
      }

      await storage.deleteMessage(messageId);
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Recent chats
  app.get("/api/chats", authenticateToken, async (req: any, res) => {
    try {
      const chats = await storage.getRecentChats(req.userId);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent chats" });
    }
  });

  // Friend routes
  app.get("/api/friends", authenticateToken, async (req: any, res) => {
    try {
      const friends = await storage.getFriends(req.userId);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Failed to get friends" });
    }
  });

  app.get("/api/friends/requests", authenticateToken, async (req: any, res) => {
    try {
      const requests = await storage.getFriendRequests(req.userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get friend requests" });
    }
  });

  app.post("/api/friends/:userId", authenticateToken, async (req: any, res) => {
    try {
      const addresseeId = parseInt(req.params.userId);
      
      if (addresseeId === req.userId) {
        return res.status(400).json({ message: "Cannot add yourself as friend" });
      }

      const friendship = await storage.createFriendRequest(req.userId, addresseeId);
      res.status(201).json(friendship);
    } catch (error) {
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.put("/api/friends/requests/:id/accept", authenticateToken, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      await storage.acceptFriendRequest(requestId);
      res.json({ message: "Friend request accepted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.put("/api/friends/requests/:id/reject", authenticateToken, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      await storage.rejectFriendRequest(requestId);
      res.json({ message: "Friend request rejected" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
