import api from "./axios";

export function getExpenses(filters = {}) {
  const params = {};
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.year) params.year = filters.year;
  if (filters.month) params.month = filters.month;
  if (filters.fundingSource) params.fundingSource = filters.fundingSource;
  return api.get("/expenses", { params }).then((res) => res.data);
}

export function createExpense(payload) {
  return api.post("/expenses", payload).then((res) => res.data);
}

export function updateExpense(id, payload) {
  return api.put(`/expenses/${id}`, payload).then((res) => res.data);
}

export function deleteExpense(id) {
  return api.delete(`/expenses/${id}`).then((res) => res.data);
}

export async function exportExpensesCsv() {
  const res = await api.get("/expenses/export", { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  const disposition = res.headers["content-disposition"];
  let filename = "expenses.csv";
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
