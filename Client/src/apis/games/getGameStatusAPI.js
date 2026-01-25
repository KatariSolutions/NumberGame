import axios from "axios";

const BASE_URL='http://localhost:8080/api'
const endpoint = BASE_URL+'/games';

export const getGameStatusAPI = async (token) => {
    try{
        const url = endpoint+`/gamestatus`
        const response = await axios.get(url, {
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