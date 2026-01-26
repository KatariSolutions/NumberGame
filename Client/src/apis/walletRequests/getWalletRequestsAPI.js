import axios from "axios";
import { ApiConfig } from "../ApiConfig";

const endpoint = ApiConfig.BASE_URL+'/walletrequests/myrequests';

export const getWalletRequestsAPI = async (userId, token) => {
    //console.log('userId, token, txn_type, start_date, end_date : ', userId, token, txn_type, start_date, end_date);
    try{
        const response = await axios.post(endpoint, {user_id : userId}, {
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