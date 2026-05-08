// export async function authFetch(url, options = {}) {
//   const token_no = localStorage.getItem("token");

//   const headers = {
//     ...(options.headers || {}),
//     "Content-Type": "application/json",
//     token_no: token_no ? token_no : null, 
//   };

//   return fetch(url, { ...options, headers });
// }

export async function authFetch(url, options = {}) {

  const token = typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
    device_type: "web",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers
  });
}

export const logoutUser = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("wishlist");
      localStorage.removeItem("cart");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userPhone");
      localStorage.removeItem("userDetails");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("wishlist_items");
    } catch {
      // ignore storage errors and still redirect
    }

    window.location.href = "/user";
  }
};