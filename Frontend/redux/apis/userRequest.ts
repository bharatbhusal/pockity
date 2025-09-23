import API from "./axiosConfig";

// Get all users
export const getUsers = () =>
  API.get("/users/")
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw error;
    });
// Get all users sessions
export const getUsersSession = (userIds: string) =>
  API.get(`/usersSession?userIds=${userIds}`)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw error;
    });

// Get a single user
export const getUserById = (userId: string) =>
  API.get(`/users/${userId}`)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw error;
    });

// Get a single user
export const getUserByUsername = (username: string) =>
  API.get(`/users/username/${username}`)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw error;
    });

export const sendBuddyRequest = (userId: string) =>
  API.put(`/users/buddy/request/${userId}`)
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });

export const acceptBuddyRequest = (userId: string) =>
  API.put(`/users/buddy/request/accept/${userId}`)
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });
