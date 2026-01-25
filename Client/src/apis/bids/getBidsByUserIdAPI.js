import axios from "axios";

const BASE_URL='https://numbergameserver.onrender.com/api'
const endpoint = BASE_URL+'/bids/getBidsbyUserId';

export const getBidsbyUserIdAPI = async (user_id, token) => {
    try{
        const response = await axios.post(endpoint, {user_id}, {
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