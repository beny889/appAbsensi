import apiClient from './client';
import { LoginRequest, LoginResponse, User } from '@/types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.user.role);
      if (response.data.user.allowedMenus) {
        localStorage.setItem('allowedMenus', JSON.stringify(response.data.user.allowedMenus));
      } else {
        localStorage.removeItem('allowedMenus');
      }
    }
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('allowedMenus');
    window.location.href = '/login';
  },

  getAllowedMenus: (): string[] | null => {
    const menus = localStorage.getItem('allowedMenus');
    return menus ? JSON.parse(menus) : null;
  },

  getUserRole: (): string | null => {
    return localStorage.getItem('userRole');
  },
};
