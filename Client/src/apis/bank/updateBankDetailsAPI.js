import axios from "axios";

const BASE_URL='https://numbergameserver.onrender.com/api'
const endpoint = BASE_URL+'/bank/update';

export const updateBankDetailsAPI = async (token, payload) => {
    try{
        const response = await axios.post(endpoint, payload, {
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