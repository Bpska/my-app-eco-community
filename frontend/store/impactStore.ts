import { create } from 'zustand';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from './authStore';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Impact {
  total_carbon_saved: number;
  money_saved: number;
  sustainable_miles: number;
  total_trips: number;
  trips_by_mode: { [key: string]: number };
  current_streak: number;
  eco_credits: number;
  badges: string[];
}

interface ImpactState {
  impact: Impact | null;
  isLoading: boolean;
  fetchImpact: () => Promise<void>;
  recordTrip: (tripData: any) => Promise<void>;
}

export const useImpactStore = create<ImpactState>((set) => ({
  impact: null,
  isLoading: false,

  fetchImpact: async () => {
    set({ isLoading: true });
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${API_URL}/api/impact`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ impact: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch impact:', error);
    }
  },

  recordTrip: async (tripData: any) => {
    try {
      const token = useAuthStore.getState().token;
      await axios.post(`${API_URL}/api/impact/record-trip`, tripData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Refresh impact data
      await useImpactStore.getState().fetchImpact();
    } catch (error) {
      console.error('Failed to record trip:', error);
    }
  },
}));