// utils/index.js

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export const getRole = () => {
  return getUser()?.role || null;
};

export const isLoggedIn = () => {
  return !!getUser()?.token;
};