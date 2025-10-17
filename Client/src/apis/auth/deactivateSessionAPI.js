import axios from "axios";

const BASE_URL='http://localhost:8080/api'
const endpoint = BASE_URL+'/auth/deactivate-session';

export const deactivateSessionAPI = async (userId, token) => {
    try{
        const response = await axios.post(endpoint, {userId}, {
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