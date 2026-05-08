axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    config.headers.token = token ? token : null;

    config.headers.token_no = getCookie("token_no") || token_no;

    return config;
  },
  (error) => Promise.reject(error)
);
