import api from './api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// @desc    Create New Customer
export const createCustomerService = async (payload) => {
    try {
        const companyId = await AsyncStorage.getItem('activeCompanyId');
        console.log("companyId",companyId);
        const finalPayload = { 
            ...payload, 
            companyId: companyId // Optional if backend extracts from token, but good for safety
        };
        console.log("finalPayload",finalPayload);
        const response = await api.post('/customers', finalPayload);
        return response.data;
    } catch (error) {
        console.log("error");
        console.log(error);
        throw error.response?.data?.message || "Creation failed";
    }
};

// @desc    Update Existing Customer
export const updateCustomerService = async (id, payload) => {
    try {
        const response = await api.put(`/customers/${id}`, payload);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Update failed";
    }
};

// @desc    Get Customer by ID
export const getCustomerByIdService = async (id) => {
    try {
        const response = await api.get(`/customers/${id}`);        
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Fetch failed";
    }
};

// @desc    Search Customers (For Referrer)
export const searchCustomerService = async (query) => {
    try {
        const response = await api.get(`/customers?search=${query}`);
        return response.data;
    } catch (error) {
        // Return empty array if search fails 
        return [];
    }
};

// @desc    Check Conflicts (Mobile/Ration)
export const checkConflictService = async (data) => {
    try {
        const response = await api.post('/customers/check-conflict', data);
        return response.data; // Returns { hasConflict: bool, warnings: [] }
    } catch (error) {
        console.error("Conflict check error", error);
        return { hasConflict: false, warnings: [] };
    }
};