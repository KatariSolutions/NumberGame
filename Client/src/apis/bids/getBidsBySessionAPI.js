import axios from "axios";
import { ApiConfig } from "../ApiConfig";

const endpoint = ApiConfig.BASE_URL+'/bids/getBidsbySession';

export const getBidsbySessionAPI = async (session_id, user_id, token) => {
    try{
        const response = await axios.post(endpoint, {session_id, user_id}, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+token
            }
        });
        return response.data;
    } catch (err) {
        throw err.response?.data ||{status: err.response?.status || 500,message:err.message};
    }
}