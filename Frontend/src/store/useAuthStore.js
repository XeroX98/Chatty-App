import {create} from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import {io} from "socket.io-client";

const BASE_URL=import.meta.env.MODE === "development" ? "http://localhost:5001":"/";

export const  useAuthStore= create((set,get)=>({

  authUser:null,
  isSigningUp:false,
  isLoggingIn:false,
  isCheckingAuth:true,
  isUpdateProfile:false,
  onlineUsers:[],
  socket:null,

  checkAuth: async ()=>{
    try {
      const res=await axiosInstance.get("/auth/check");
      set({authUser:res.data});
      get().connectSocket();
    } catch (error) {
      console.log("Error in the checkAuth",error);
      set({authUser:null});

    } finally{
      set({isCheckingAuth:false});
    }
  },
  signup:async (data)=>{
    set({isSigningUp:true});
    try {
      const res=await axiosInstance.post("/auth/signup",data);
      toast.success("Account created successfully");
      set({authUser:res.data});
      get().connectSocket();

    } catch (error) {
      toast.error(error.response.data.message);
    }
    finally{
      set({inSignUp:false});
    }
  },

    login:async (data)=>{
         set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

     get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
    },

    logout: async()=>{
    try {
      await axiosInstance.post('/auth/logout');
      set({authUser:null});
      toast.success("Logged out successfully.");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  updateProfile: async (formData) => {
  set({ isUpdatingProfile: true });
  try {
    const res = await axiosInstance.post("/auth/updateProfile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    set({
      authUser: (prev) => ({ ...prev, profilePic: res.data.profilePic }),
    });

    toast.success("Profile updated successfully");
  } catch (error) {
    console.log("Error in updateProfile store:", error);
    toast.error("Failed to update profile");
  } finally {
    set({ isUpdatingProfile: false });
  }
},
  connectSocket: ()=>{
    const {authUser}=get()
    if(!authUser || get().socket?.connected) return;

    const socket=io(BASE_URL,{
      query:{
        userId:authUser._id,

      },
    });
    socket.connect();
    set({socket:socket});

    socket.on("getOnlineUsers", (userIds)=>{
      set({onlineUsers:userIds});
    })
  },
  disconnectSocket: ()=>{
    if(get().socket?.connected) get().socket.disconnect();
  },
}));