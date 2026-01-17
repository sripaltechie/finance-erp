import api from './api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// @desc    Get All Staff for the current Company
// @route   GET /api/staff/:companyId
export const getStaffListService = async () => {
    try {
        const companyId = await AsyncStorage.getItem('activeCompanyId');
        if (!companyId) throw new Error("No Company Selected");

        const response = await api.get(`/staff/${companyId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Failed to fetch staff list";
    }
};

// @desc    Create New Staff
// @route   POST /api/staff
export const createStaffService = async (payload) => {
    try {
        const companyId = await AsyncStorage.getItem('activeCompanyId');
        if (!companyId) throw new Error("No Company Selected");

        const fullPayload = { ...payload, companyId };
        
        const response = await api.post('/staff', fullPayload);
        return response.data;
    } catch (error) {
        // console.log(error);
        throw error.response?.data?.message || "Failed to create staff";
    }
};


// @desc    Get Single Staff by ID (🟢 NEW)
export const getStaffByIdService = async (id) => {
    try {
        const response = await api.get(`/staff/detail/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Failed to fetch staff details";
    }
};

// @desc    Update Staff (Role, Name, Password)
// @route   PUT /api/staff/:id
export const updateStaffService = async (id, payload) => {
    try {
        const response = await api.put(`/staff/${id}`, payload);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Failed to update staff";
    }
};

// @desc    Delete Staff
// @route   DELETE /api/staff/:id
export const deleteStaffService = async (id) => {
    try {
        const response = await api.delete(`/staff/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || "Failed to delete staff";
    }
};