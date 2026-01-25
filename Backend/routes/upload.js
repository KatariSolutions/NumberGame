import express from "express";
import { pool, poolConnect } from "../db.js";
import { upload } from "../middleware/fileUpload.js";
import { containerClient } from "../azureBlob.js";
import { v4 as uuidv4 } from "uuid";

const uploadRouter = express.Router();

/**
 * POST: Upload profile picture
 */
uploadRouter.post("/upload-profile-pic", upload.single("image"), async (req, res) => {
    try {
      await poolConnect;

      const { user_id } = req.body;
      const file = req.file;

      if (!file) {
        return res
          .status(209)
          .json({ status: 209, message: "No file uploaded" });
      }

      // 🔒 Safety fallback (frontend is primary validator)
      if (file.size > 2 * 1024 * 1024) {
        return res
          .status(209)
          .json({
            status: 209,
            message: "File size must be less than 2MB"
          });
      }

      /* =====================================================
         🧹 DELETE EXISTING PROFILE PICTURES (ADD THIS BLOCK)
         ===================================================== */
      for await (const blob of containerClient.listBlobsFlat({
        prefix: `${user_id}/`
      })) {
        const blobClient =
          containerClient.getBlockBlobClient(blob.name);

        await blobClient.deleteIfExists();
      }
      /* =================== END DELETE BLOCK =================== */

      const blobName = `${user_id}/${uuidv4()}-${file.originalname}`;
      const blockBlobClient =
        containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        }
      });

      const imageUrl = blockBlobClient.url;

      await pool.request()
        .input("user_id", user_id)
        .input("avatar_url", imageUrl)
        .query(`
          IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = @user_id)
          BEGIN
            UPDATE user_profiles
            SET avatar_url = @avatar_url
            WHERE user_id = @user_id
          END
          ELSE
          BEGIN
            INSERT INTO user_profiles (user_id, avatar_url)
            VALUES (@user_id, @avatar_url)
          END
        `);
      
      res.status(201).json({
        status: 201,
        message: "Profile picture uploaded successfully"
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: 500,
        message: "Server error"
      });
    }
  }
);

export default uploadRouter;