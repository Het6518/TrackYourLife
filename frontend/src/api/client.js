export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

function authHeaders(token) {
  return token ? { Authorization: `Token ${token}` } : {};
}

export async function request(path, options = {}, token = "") {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
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
  uploadAvatar: (file, token) => {
    const body = new FormData();
    body.append("avatar", file);
    return request("/auth/me/avatar/", { method: "POST", body }, token);
  },
  removeAvatar: (token) => request("/auth/me/avatar/", { method: "DELETE" }, token),
  updateLocation: (latitude, longitude, token) =>
    request("/auth/me/location/", { method: "PUT", body: JSON.stringify({ latitude, longitude }) }, token),
  updateBoardStyle: (background, token) =>
    request("/auth/me/board-style/", { method: "PUT", body: JSON.stringify({ background }) }, token),
};

export const daysApi = {
  list: (token) => request("/days/", {}, token),
  create: (payload, token) => request("/days/", { method: "POST", body: JSON.stringify(payload) }, token),
  update: (id, payload, token) => request(`/days/${id}/`, { method: "PUT", body: JSON.stringify(payload) }, token),
  remove: (id, token) => request(`/days/${id}/`, { method: "DELETE" }, token),
  publicUsers: () => request("/public/users/"),
  // token is optional here — passing it lets the backend include friends-only
  // entries when the viewer is friends with (or is) that user
  publicUserDays: (username, token = "") => request(`/public/users/${username}/days/`, {}, token),
};

export const musicApi = {
  list: (token) => request("/songs/", {}, token),
  upload: ({ title, artist, file }, token) => {
    const body = new FormData();
    body.append("title", title);
    if (artist) body.append("artist", artist);
    body.append("audio", file);
    return request("/songs/", { method: "POST", body }, token);
  },
  remove: (id, token) => request(`/songs/${id}/`, { method: "DELETE" }, token),
};

export const boardApi = {
  list: (token) => request("/goals/", {}, token),
  create: (payload, token) => {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) body.append(key, value);
    });
    return request("/goals/", { method: "POST", body }, token);
  },
  update: (id, payload, token) => request(`/goals/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }, token),
  remove: (id, token) => request(`/goals/${id}/`, { method: "DELETE" }, token),
};

export const friendsApi = {
  list: (token) => request("/friends/", {}, token),
  requests: (token) => request("/friends/requests/", {}, token),
  send: (username, token) => request("/friends/requests/", { method: "POST", body: JSON.stringify({ username }) }, token),
  accept: (id, token) => request(`/friends/requests/${id}/accept/`, { method: "POST" }, token),
  decline: (id, token) => request(`/friends/requests/${id}/decline/`, { method: "POST" }, token),
  remove: (username, token) => request(`/friends/${username}/`, { method: "DELETE" }, token),
  search: (query, token) => request(`/friends/search/?q=${encodeURIComponent(query)}`, {}, token),
};
