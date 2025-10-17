import axios from "axios";

const BASE_URL='http://localhost:8080/api'
const endpoint = BASE_URL+'/user';

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
        throw err.response?.data ||{message:err.message};
    }
}