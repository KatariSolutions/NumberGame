import axios from "axios";
import { ApiConfig } from "../ApiConfig";

const endpoint = ApiConfig.BASE_URL+'/upload/upload-profile-pic';

export const uploadProfile = async (formData, token) => {
    try{
        const response = await axios.post(endpoint, formData, {
            headers: {
                "Authorization": "Bearer "+token
            }
        });
        return response.data;
    } catch (err) {
        throw err.response?.data ||{status: err.response?.status || 500,message:err.message};
    }
}