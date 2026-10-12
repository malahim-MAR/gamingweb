'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface Preferences {
  favorites: string[];
  skin: string;
  toggleFavorite: (s: string) => void;
  setSkin: (s: string) => void;
}
export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      favorites: [],
      skin: 'sunset',
      toggleFavorite: (slug) =>
        set((s) => ({
          favorites: s.favorites.includes(slug)
            ? s.favorites.filter((x) => x !== slug)
            : [...s.favorites, slug],
        })),
      setSkin: (skin) => set({ skin }),
    }),
    { name: 'playroom-preferences' },
  ),
);
