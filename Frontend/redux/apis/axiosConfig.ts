import { env } from "@/config/env";
import axios from "axios";

const API = axios.create({
  baseURL: `${env.NEXT_PUBLIC_SERVER_URL}/api/`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json", // default is JSON
    Accept: "application/json, multipart/form-data",
  },
});

export default API;
