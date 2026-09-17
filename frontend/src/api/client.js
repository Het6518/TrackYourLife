export const API_URL = "http://127.0.0.1:8000/api";

function authHeaders(token) {
  return token ? { Authorization: `Token ${token}` } : {};
}

export async function request(path, options = {}, token = "") {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data.detail ||
      data.non_field_errors?.[0] ||
      Object.values(data).flat().join(" ") ||
      "Something went wrong.";
    throw new Error(message);
  }
  return data;
}

export const authApi = {
  register: (payload) => request("/auth/register/", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login/", { method: "POST", body: JSON.stringify(payload) }),
  me: (token) => request("/auth/me/", {}, token),
  logout: (token) => request("/auth/logout/", { method: "POST" }, token),
};

export const daysApi = {
  list: (token) => request("/days/", {}, token),
  create: (payload, token) => request("/days/", { method: "POST", body: JSON.stringify(payload) }, token),
  update: (id, payload, token) => request(`/days/${id}/`, { method: "PUT", body: JSON.stringify(payload) }, token),
  remove: (id, token) => request(`/days/${id}/`, { method: "DELETE" }, token),
  publicUsers: () => request("/public/users/"),
  publicUserDays: (username) => request(`/public/users/${username}/days/`),
};
