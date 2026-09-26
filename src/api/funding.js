import api from "./axios";

export function getFunding(source) {
  const params = {};
  if (source) params.source = source;
  return api.get("/funding", { params }).then((res) => res.data);
}

export function createFunding(payload) {
  return api.post("/funding", payload).then((res) => res.data);
}

export function updateFunding(id, payload) {
  return api.put(`/funding/${id}`, payload).then((res) => res.data);
}

export function deleteFunding(id) {
  return api.delete(`/funding/${id}`).then((res) => res.data);
}
