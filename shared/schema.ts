import { pgTable, text, serial, integer, boolean, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  profilePicture: text("profile_picture"),
  statusMessage: text("status_message"),
  status: text("status").notNull().default("offline"), // online, away, offline
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").notNull().default(false),
  inviteCode: text("invite_code").unique(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roomMembers = pgTable("room_members", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"), // admin, member
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  roomId: integer("room_id").references(() => rooms.id),
  recipientId: integer("recipient_id").references(() => users.id), // for direct messages
  messageType: text("message_type").notNull().default("text"), // text, image, file
  fileName: text("file_name"), // original filename for attachments
  fileUrl: text("file_url"), // URL or data URL for file/image
  fileSize: integer("file_size"), // file size in bytes
  mimeType: text("mime_type"), // MIME type of the file
  isEdited: boolean("is_edited").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  addresseeId: integer("addressee_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  roomMembers: many(roomMembers),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  createdRooms: many(rooms),
  sentFriendRequests: many(friendships, { relationName: "sentFriendRequests" }),
  receivedFriendRequests: many(friendships, { relationName: "receivedFriendRequests" }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  creator: one(users, {
    fields: [rooms.createdBy],
    references: [users.id],
  }),
  members: many(roomMembers),
  messages: many(messages),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMembers.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomMembers.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  requester: one(users, {
    fields: [friendships.requesterId],
    references: [users.id],
    relationName: "sentFriendRequests",
  }),
  addressee: one(users, {
    fields: [friendships.addresseeId],
    references: [users.id],
    relationName: "receivedFriendRequests",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(1, "Display name is required"),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  createdBy: true,
  inviteCode: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  senderId: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  requesterId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type RoomMember = typeof roomMembers.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
