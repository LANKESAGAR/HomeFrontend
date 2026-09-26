import api from "./axios";

export function getCategories() {
  return api.get("/categories").then((res) => res.data);
}

export function createCategory(payload) {
  return api.post("/categories", payload).then((res) => res.data);
}

export function updateCategory(id, payload) {
  return api.put(`/categories/${id}`, payload).then((res) => res.data);
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`).then((res) => res.data);
}
