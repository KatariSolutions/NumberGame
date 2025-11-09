import axios from "axios";

const BASE_URL='http://localhost:8080/api'
const endpoint = BASE_URL+'/wallet/transactions';

export const getWalletTransactionsAPI = async (userId, token, txn_type, start_date, end_date) => {
    //console.log('userId, token, txn_type, start_date, end_date : ', userId, token, txn_type, start_date, end_date);
    try{
        const url = endpoint+`/${userId}`
        const payload = {
            txn_type: txn_type?.toLowerCase() === 'all' ? null : txn_type,
            start_date: start_date || null,
            end_date: end_date || null
        }
        const response = await axios.post(url, payload, {
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