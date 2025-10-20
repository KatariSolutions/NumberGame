import axios from "axios";

const BASE_URL='http://localhost:8080/api'
const endpoint = BASE_URL+'/user/userdetailsavailable';

export const checkUserDetailsAvailableAPI = async (user_id, token) => {
  try {
    const response = await axios.post(
        endpoint,
        { user_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
    );

    return {
        status: response.status,
        message: response.data.message,
    };
  } catch (error) {
        console.error("Error checking user details availability:", error);
        return {
            status: error.response?.status || 500,
            message: false,
        };
  }
};
