import axios from 'axios';

const GAS_URL = import.meta.env.VITE_GAS_URL;

export const apiService = {
  async post(data) {
    try {
      const response = await axios.post(GAS_URL, JSON.stringify(data), {
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error en la petición:', error);
      throw error;
    }
  },

  async get(params = {}) {
    try {
      const response = await axios.get(GAS_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error en la petición GET:', error);
      throw error;
    }
  },
};

export const actions = {
  CREATE_PEDIDO: 'CREATE_PEDIDO',
  GET_PEDIDOS: 'GET_PEDIDOS',
  GET_PEDIDO_BY_ID: 'GET_PEDIDO_BY_ID',
  SEARCH_PEDIDOS: 'SEARCH_PEDIDOS',
  UPDATE_PEDIDO: 'UPDATE_PEDIDO',
  DELETE_PEDIDO: 'DELETE_PEDIDO',
  ANNUL_PEDIDO: 'ANNUL_PEDIDO',
  UPLOAD_PHOTO: 'UPLOAD_PHOTO',
  ADD_ABONO: 'ADD_ABONO',
  GET_ABONOS: 'GET_ABONOS',
};
