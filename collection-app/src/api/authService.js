import api from './api'; // Importing the NEW base instance

export const registerClientService = async (payload) => {
  try {
    const response = await api.post('/auth/client/register', payload);
    return response.data; 
  } catch (error) {
    if (error.response) {
      console.error("❌ Backend Error:", error.response.data);
      throw error.response.data; 
    } else {
      throw new Error("Cannot connect to server.");
    }
  }
};

export const loginClientService = async (payload) => {
    try {
        const response = await api.post('/auth/client/login', payload);
        return response.data;
    } catch (error) {
      // console.log("hitvhi ",error);
        // if (error.response) {
        //     throw error.response.data?.message || "Login Failed"; 
        // } else {
        //     throw new Error("Network Error");
        // }
        if (error.response) {
          console.error("❌ Backend Error:", error.response.data);
          throw error.response.data;
        } else if (error.request) { // ✅ Change 'request' to 'error.request'
          console.error("❌ Network Error: No response received from", Config.API_URL);
          throw new Error("Server not responding. Check if Backend is running.");
        } else {
          console.error("❌ Request Error:", error.message);
          throw error;
      }
    }
};

// } catch (error) {
//     // Professional Error Logging
//     if (error.response) {
//       // The server responded with a status code (400, 401, 500, etc.)
//       console.error("❌ Backend Error:", error.response.data);
//       throw error.response.data; // Pass the real error message to your UI
//     } else if (request) {
//       // The request was made but no response was received (Network/IP issues)
//       console.error("❌ Network Error: No response from server at", API_URL);
//       throw new Error("Cannot connect to server. Check your IP/Wi-Fi.");
//     } else {
//       console.error("❌ Request Setup Error:", error.message);
//       throw error;

