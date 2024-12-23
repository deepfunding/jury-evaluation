import { create } from "zustand";

export const useUserStore = create((set) => ({
	userData: {
		name: "",
		email: "",
		inviteCode: "",
	},
	setUserData: (data) => set({ userData: data }),
}));
