import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem('theme') || 'dark',
  
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    
    // Dynamically update document data-theme or class for styling
    document.documentElement.setAttribute('data-theme', nextTheme);
    return { theme: nextTheme };
  }),

  setTheme: (newTheme) => set(() => {
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    return { theme: newTheme };
  })
}));
