import axios from "axios";

const BASE_URL='http://localhost:8080/api'
const endpoint = BASE_URL+'/auth/verify-token';

export const verifyToken = async (payload, token) => {
    try{
        const response = await axios.post(endpoint, payload, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+token
            }
        });
        return response.data;
    } catch (err) {
        throw err.response?.data ||{status: err.response?.status || 500, message:err.message};
    }
}