import { BlobServiceClient } from "@azure/storage-blob";
import config from "./config.js";

const blobServiceClient = BlobServiceClient.fromConnectionString(
  config.azure_storage_connection_string
);

export const containerClient =
  blobServiceClient.getContainerClient("profile-pics");

export const walletContainerClient = 
  blobServiceClient.getContainerClient("wallet-requests");