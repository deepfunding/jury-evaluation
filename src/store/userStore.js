import { create } from "zustand";

export const useUserStore = create((set) => ({
	userData: {
		name: "",
		email: "",
		uniqueKey: "",
	},
	setUserData: (data) => set({ userData: data }),
}));
