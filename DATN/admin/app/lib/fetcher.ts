export async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  // AT hết hạn
  if (res.status === 401) {
    const refreshRes = await fetch("http://localhost:5000/api/refresh-token", {
      method: "POST",
      credentials: "include",
    });

    if (!refreshRes.ok) {
      throw new Error("Session expired");
    }

    // refresh thành công → gọi lại API ban đầu
    return fetch(url, {
      ...options,
      credentials: "include",
    });
  }

  return res;
}
