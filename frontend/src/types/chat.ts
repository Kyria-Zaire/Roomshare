/**
 * Types pour le système de Chat — miroir du schéma MongoDB backend.
 */

export interface Conversation {
  id: string;
  _id?: string;
  participants: string[];
  room_id: string;
  room_title: string;
  /** Nom de l'autre participant (renvoyé par l'API pour l'affichage). */
  other_participant_name?: string | null;
  last_message: string | null;
  last_sender_id: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id?: string;
  _id?: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
}

export interface UnreadCount {
  unread_count: number;
}

/** Payload reçu via WebSocket (broadcast) */
export interface MessageBroadcast {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}
