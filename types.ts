// types.ts

/**
 * Represents a menu item from a restaurant.
 */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
}

/**
 * Defines the type of establishment, either a restaurant or a drink shop.
 */
export type OrderType = '餐廳' | '飲料店';

/**
 * Represents a restaurant or a drink shop, containing its details and menu.
 */
export interface Restaurant {
  id:string;
  name: string;
  type: OrderType;
  cuisine: string;
  image: string;
  menu: MenuItem[];
}

/**
 * Represents a team member.
 */
export interface User {
  id: string; // Document ID from Firestore 'teamMembers' collection or Firebase UID
  name: string;
  role: 'admin' | 'colleague';
  uid?: string; // Firebase Auth UID, present when logged in
}

/**
 * Represents a single item within an order, including quantity and special notes.
 */
export interface OrderItem {
  item: MenuItem;
  quantity: number;
  notes: string;
}

/**
 * Represents a user's complete order for the current session.
 */
export interface Order {
  userId: string; // The user's ID (document ID from the 'orders' subcollection)
  userName: string;
  items: OrderItem[];
  status: 'submitted' | 'locked' | 'confirmed';
  isPaid?: boolean; // 新增：追蹤付款狀態
  confirmedAt?: string; // 新增：確認訂單的時間
}

/**
 * Represents a user's vote on a restaurant proposal.
 */
export interface Vote {
  vote: 'agree' | 'disagree';
}

/**
 * A collection of all votes for the current proposal, keyed by user ID.
 */
export type Votes = Record<string, Vote>;

/**
 * Represents a user's suggestion for a restaurant to order from.
 */
export interface Suggestion {
  userId: string;
  userName: string;
  restaurantId: string;
  restaurantName: string;
}

/**
 * Maps Firebase Auth UIDs to user data for the current day to track active participants.
 * Key: Firebase Auth UID
 */
export type UserMappings = Record<string, { name: string }>;


/**
 * Holds all the data for the current day's ordering session.
 */
export interface SessionData {
  id: string; // YYYY-MM-DD
  status: 'ORDERING' | 'SUMMARY' | 'COMPLETED';
  admin: User;
  orderType: OrderType | null;
  deadline: string;
  proposedRestaurant: Restaurant | null;
  isProposalRejected: boolean;
  createdAt: string; // ISO 8601 string of when the session was created
  completedAt?: string; // ISO 8601 string for when the session was completed
}

/**
 * This constant is kept for legacy compatibility but is no longer used for storing users.
 * Users are now fetched dynamically from Firestore.
 */
export const USERS: User[] = [];