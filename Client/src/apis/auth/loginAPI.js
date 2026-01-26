import axios from "axios";
import { ApiConfig } from "../ApiConfig";

const endpoint = ApiConfig.BASE_URL+'/auth/login';

export const loginAPI = async (payload) => {
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