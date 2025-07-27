import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-type': 'application/json'
  }
})

export const getStores = () => api.get('/stores');
export const createStore = (storeData) => api.post('/stores', storeData);

export const getProducts = () => api.get('/products');
export const createProduct = (productData) => api.post('/products', productData);

export const getExpenses = () => api.get('/expenses');
export const createExpense = (expenseData) => api.post('/expenses', expenseData);

export const compareProductPrices = (productId) => api.get(`/compare-product-prices/${productId}`);

export default api