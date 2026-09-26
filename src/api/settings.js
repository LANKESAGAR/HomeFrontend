import api from "./axios";

export function getSettings() {
  return api.get("/settings").then((res) => res.data);
}

export function updateSettings(payload) {
  return api.put("/settings", payload).then((res) => res.data);
}

export function refreshExchangeRate() {
  return api.post("/settings/refresh-exchange-rate").then((res) => res.data);
}
