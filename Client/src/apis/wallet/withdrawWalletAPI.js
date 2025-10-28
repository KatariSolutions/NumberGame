import axios from "axios";

const BASE_URL='http://localhost:8080/api'
const endpoint = BASE_URL+'/wallet/debit';

export const withdrawWalletAPI = async (userId, token, amount, reference_id, type='SELF') => {
    try{
        const payload = {user_id : userId,amount,reference_id,type}
        const response = await axios.post(endpoint, payload, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer "+token
            }
        });
        return response.data;
    } catch (err) {
        throw err.response?.data ||{message:err.message};
    }
}