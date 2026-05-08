
import { API_BASE_URL, IMAGE_BASE_URL } from "../constants/urls";

export const BASE_URL = API_BASE_URL;

export const BASE_URL_IMAGE = IMAGE_BASE_URL;

export const cleanUrl = (url) => url.replace(/([^:]\/)\/+/g, "$1");

export const API_ENDPOINTS = {
  productList: "api/productList",
  productListByCategory: "api/productList",
  singleProduct: "api/product",
  allCategories: "api/categories",

  addToCart: "api/addToCart",
  changeCartQuantity: "api/cart/quantityChange",
  getUserCartData: "api/getUserCartData",

  user: {
    sendOtp: "user/sendOtp",
    loginUser: "user/loginUser",
    getAddresses: "user/getAddresses",
    addAddress: "user/addAddress",
    updateAddress: "user/updateAddress",
    deleteAddress: "user/deleteAddress",
    getWishlist: "user/getWishlistByUser",
    getProfile: "user/getUserProfile",
    updateProfile: "user/updateUserProfile",
    updateProfilePicture: "user/updateUserProfilePicture",
    getReviews: "user/getUserReviews",
    addToWishlist: "user/addToWishlist",
    removeFromWishlist: "user/removeFromWishlist",
  },

  order: {
    getOrdersByUser: "order/getOrdersByUser",
    getOrderItemById: "order/getOrderItemById",
    requestCancel: "order/requestCancel",
    requestReturn: "order/requestReturn",
    createOrder: "order/createOrder",
    verifyPayment: "order/verifyPayment",
    checkShippingAndCOD: "orders/checkShippingAndCOD",
  },

  coupons: {
    getUserCoupons: "api/getUserCoupons",
    applyCoupon: "api/applyCoupon",
  },

  reviews: {
    removeImage: "api/removeReviewImage",
    editReview: "api/editReview",
    addReview: "api/addReview",
    getReviewData: "api/getReviewData",
  },

  searchProducts: "api/products/search",
};

export const buildApiUrl = (path) => cleanUrl(`${BASE_URL}/${path}`);
export const buildImageUrl = (path) => cleanUrl(`${BASE_URL_IMAGE}/${path}`);

export async function apiFetch(url, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (token) {
    headers.token_no = token;
    headers.token = token; 
  }

  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  return res;
}

