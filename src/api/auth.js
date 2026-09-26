import api from "./axios";

export function login(username, password) {
  return api.post("/auth/login", { username, password }).then((res) => res.data);
}

export function register({ username, password, name, inviteCode }) {
  return api
    .post("/auth/register", { username, password, name, inviteCode })
    .then((res) => res.data);
}

export function changePassword({ currentPassword, newPassword }) {
  return api
    .post("/auth/change-password", { currentPassword, newPassword })
    .then((res) => res.data);
}
