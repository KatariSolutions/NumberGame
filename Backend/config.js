import dotenv from 'dotenv';
//const assert = require('assert');

dotenv.config();

const {PORT,HOST,HOST_URL,DB_SERVER,DB_USER,DB_PASSWORD,DB_DATABASE,DB_PORT,JWT_SECRET} = process.env;

const sqlEncrypt = process.env.ENCRYPT === "true";
const trustServerCertificate = process.env.DB_TRUST_SERVER_CERTIFICATE === "true";

//assert(PORT, 'PORT is Required');
//assert(HOST, 'HOST is Required');

export default {
    port : PORT,
    host : HOST,
    url : HOST_URL,
    jwtsecret : JWT_SECRET,
    sql: {
        server: DB_SERVER,
        database: DB_DATABASE,
        user: DB_USER,
        password: DB_PASSWORD,
        options: {
            encrypt: sqlEncrypt,
            "trustServerCertificate": trustServerCertificate,
            port: 1433
        }
    }
}