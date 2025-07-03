import axios from "axios";

const API_URL = process.env.REACT_APP_BASE_URL || "";

export const register = (data) => axios.post(`${API_URL}/signup`, data);
export const login = (data) => axios.post(`${API_URL}/login`, data);

export const getAllCustomerByPagination = (token, page = 1, limit = 10) =>
  axios.get(`${API_URL}/customer?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getAllCustomers = (token) =>
  axios.get(`${API_URL}/customers`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const saveCustomer = (data, token) =>
  axios.post(`${API_URL}/customer`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
