import axios from "axios";

const BASE_URL='http://localhost:8080/api'
const endpoint = BASE_URL+'/wallet/balance';

export const getWalletBalanceAPI = async (userId, token) => {
    try{
        const url = endpoint+`/${userId}`
        const response = await axios.get(url, {
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