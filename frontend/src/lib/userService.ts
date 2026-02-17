import apiClient from "@/lib/apiClient";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UserSearchResult {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  bio?: string | null;
}

export interface UserSettings {
  verification_status: string;
  notify_messages: boolean;
  notify_annonces: boolean;
  name: string;
  email: string;
  bio: string;
  phone: string;
  avatar_url: string | null;
}

export interface UserProfileUpdate {
  name?: string;
  email?: string;
  bio?: string;
  phone?: string;
}

export const userService = {
  async search(query: string): Promise<ApiResponse<UserSearchResult[]>> {
    const { data } = await apiClient.get<ApiResponse<UserSearchResult[]>>("/users/search", {
      params: { query },
    });
    return data;
  },

  async getSuggestions(): Promise<ApiResponse<UserSearchResult[]>> {
    const { data } = await apiClient.get<ApiResponse<UserSearchResult[]>>("/users/suggestions");
    return data;
  },

  async getSettings(): Promise<ApiResponse<UserSettings>> {
    const { data } = await apiClient.get<ApiResponse<UserSettings>>("/user/settings");
    return data;
  },

  async updateProfile(payload: UserProfileUpdate): Promise<ApiResponse<UserSettings>> {
    const { data } = await apiClient.put<ApiResponse<UserSettings>>("/user/profile", payload);
    return data;
  },

  async updateSettings(payload: { notify_messages?: boolean; notify_annonces?: boolean }): Promise<ApiResponse<{ notify_messages: boolean; notify_annonces: boolean }>> {
    const { data } = await apiClient.patch<ApiResponse<{ notify_messages: boolean; notify_annonces: boolean }>>("/user/settings", payload);
    return data;
  },

  async exportData(): Promise<ApiResponse<Record<string, unknown>>> {
    const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>("/user/export");
    return data;
  },

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await apiClient.post<ApiResponse<{ avatar_url: string }>>("/user/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
