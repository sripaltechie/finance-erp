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

// @desc    Search Customers (Fix: Passes companyId)
export const searchCustomerService = async (query) => {
    try {
        const companyId = await AsyncStorage.getItem('activeCompanyId');
        if (!companyId) throw new Error("No Company Selected");

        // Append companyId to the query parameters
        const response = await api.get(`/customers?companyId=${companyId}&search=${query}`);
        return response.data;
    } catch (error) {
        console.error("Search Error:", error);
        // Return empty array instead of throwing to prevent UI crash on search fail
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