import axios from "axios";

const BASE_URL='https://numbergameserver.onrender.com/api'
const endpoint = BASE_URL+'/walletrequests/create';

export const rechargeWalletRequestAPI = async (formData, token) => {
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