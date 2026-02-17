import apiClient from "@/lib/apiClient";

export interface SuggestedRoom {
  id: string;
  title: string;
}

export interface UserSearchResult {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  suggested_room?: SuggestedRoom;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const userSearchService = {
  async search(query: string): Promise<UserSearchResult[]> {
    if (!query.trim()) return [];
    const { data } = await apiClient.get<ApiResponse<UserSearchResult[]>>("/users/search", {
      params: { query: query.trim() },
    });
    return data.data ?? [];
  },

  async getSuggestions(): Promise<UserSearchResult[]> {
    const { data } = await apiClient.get<ApiResponse<UserSearchResult[]>>("/users/suggestions");
    return data.data ?? [];
  },
};
