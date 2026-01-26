import axios from "axios";
import { ApiConfig } from "../ApiConfig";

const endpoint = ApiConfig.BASE_URL+'/user';

export const getProfileDetailsAPI = async (userId, token) => {
    try{
        const url = endpoint+`/${userId}`
        const response = await axios.post(url, {userId}, {
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