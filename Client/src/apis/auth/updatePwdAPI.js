import axios from "axios";

const BASE_URL='http://localhost:8080/api'
const endpoint = BASE_URL+'/auth/update-password';

export const updatePwd = async (payload) => {
    try{
        const response = await axios.post(endpoint, payload, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (err) {
        throw err.response?.data ||{status: err.response?.status || 500, message:err.message};
    }
}