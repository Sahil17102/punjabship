import api from "./axios";

export const loginAdmin = async (email, password) => {
  const response = await api.post("/auth/admin/login", { email, password });
  return response.data;
};

export const logoutAdmin = async () => {
  return await api.post("/auth/logout");
};

export const changeAdminPassword = async ({ currentPassword, newPassword }) => {
  const response = await api.post('/auth/admin/change-password', {
    currentPassword,
    newPassword,
  })
  return response.data
}
