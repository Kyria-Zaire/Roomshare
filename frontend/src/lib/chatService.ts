import apiClient from "@/lib/apiClient";
import type { ApiResponse } from "@/types/room";
import type { Conversation, ConversationDetail, Message, UnreadCount } from "@/types/chat";

/**
 * Service API pour le chat — consomme les endpoints conversations/messages.
 *
 * L'authentification se fait via le token Bearer (géré par l'intercepteur apiClient).
 */
export const chatService = {

  /**
   * GET /api/v1/conversations
   */
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const { data } = await apiClient.get<ApiResponse<Conversation[]>>("/conversations");
    return data;
  },

  /**
   * POST /api/v1/conversations
   */
  async createConversation(
    recipientId: string,
    roomId: string,
    roomTitle: string,
    initialMessage?: string
  ): Promise<ApiResponse<Conversation>> {
    const payload: Record<string, string> = {
      recipient_id: recipientId,
      room_id: roomId,
      room_title: roomTitle,
    };
    if (initialMessage) {
      payload.initial_message = initialMessage;
    }
    const { data } = await apiClient.post<ApiResponse<Conversation>>("/conversations", payload);
    return data;
  },

  /**
   * GET /api/v1/conversations/:id
   */
  async getConversation(id: string): Promise<ApiResponse<ConversationDetail>> {
    const { data } = await apiClient.get<ApiResponse<ConversationDetail>>(`/conversations/${id}`);
    return data;
  },

  /**
   * POST /api/v1/messages
   */
  async sendMessage(conversationId: string, body: string): Promise<ApiResponse<Message>> {
    const { data } = await apiClient.post<ApiResponse<Message>>("/messages", {
      conversation_id: conversationId,
      body,
    });
    return data;
  },

  /**
   * GET /api/v1/conversations/unread/count
   * En cas de timeout ou d'erreur réseau, retourne 0 pour ne pas bloquer l'UI.
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCount>> {
    try {
      const { data } = await apiClient.get<ApiResponse<UnreadCount>>("/conversations/unread/count");
      return data;
    } catch {
      return { success: true, data: { unread_count: 0 } };
    }
  },
};
