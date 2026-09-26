import api from "./axios";

export function getDocuments(category) {
  const params = {};
  if (category) params.category = category;
  return api.get("/documents", { params }).then((res) => res.data);
}

export function uploadDocument({ file, title, category, uploadedBy, notes }, onUploadProgress) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("category", category);
  formData.append("uploadedBy", uploadedBy);
  if (notes) formData.append("notes", notes);

  return api
    .post("/documents", formData, { onUploadProgress })
    .then((res) => res.data);
}

export function deleteDocument(id) {
  return api.delete(`/documents/${id}`).then((res) => res.data);
}
