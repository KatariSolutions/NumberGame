import express from 'express';
import { pool, poolConnect } from '../db.js';
import config from '../config.js';

const userRouter = express.Router();

// ✅ Get all users
userRouter.get('/all', async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request()
      .query("SELECT user_id, email, phone, created_at, is_admin FROM users");

    res.status(201).json({ status:201, message: 'success', result: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status : 500, error: 'Server error' });
  }
});


// ✅ Create or update user profile
userRouter.post('/update-profile', async (req, res) => {
  try {
    await poolConnect;

    const { user_id, name, dob, avatar, address, pincode } = req.body;
    const formattedDob = dob ? new Date(dob) : null;

    if (!user_id) {
      return res.status(401).json({ status:401, error: 'User ID is required' });
    }

    // Check if a profile already exists
    const checkResult = await pool.request()
      .input('user_id', user_id)
      .query(`SELECT COUNT(*) AS count FROM user_profiles WHERE user_id = @user_id`);

    const recordExists = checkResult.recordset[0].count > 0;

    if (recordExists) {
      // 🔄 Update existing profile
      await pool.request()
        .input('user_id', user_id)
        .input('name', name || '')
        .input('dob', formattedDob || '')
        .input('avatar', avatar || '')
        .input('address', address || '')
        .input('pincode', pincode || '')
        .query(`
          UPDATE user_profiles
          SET full_name = @name,
              dob = @dob,
              avatar_url = @avatar,
              address = @address,
              pincode = @pincode,
              updated_at = GETDATE()
          WHERE user_id = @user_id
        `);

      return res.status(201).json({ status:201, message: 'Profile updated successfully' });
    } else {
      // 🆕 Insert new profile
      await pool.request()
        .input('user_id', user_id)
        .input('name', name || '')
        .input('dob', formattedDob || '')
        .input('avatar', avatar || '')
        .input('address', address || '')
        .input('pincode', pincode || '')
        .query(`
          INSERT INTO user_profiles (user_id, full_name, dob, avatar_url, address, pincode, created_at)
          VALUES (@user_id, @name, @dob, @avatar, @address, @pincode, GETDATE())
        `);

      return res.status(201).json({ status:201, message: 'Profile created successfully' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status : 500, error: 'Server error' });
  }
});

// ✅ Check if user profile details are available
userRouter.post('/userdetailsavailable', async (req, res) => {
  try {
    await poolConnect;

    const { user_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ status : 401, error: 'User ID is required' });
    }

    // Fetch user profile details
    const result = await pool.request()
      .input('user_id', user_id)
      .query(`
        SELECT full_name, dob, address, pincode 
        FROM user_profiles 
        WHERE user_id = @user_id
      `);

    if (result.recordset.length === 0) {
      // No profile exists
      return res.status(209).json({ status : 209, message: false });
    }

    const profile = result.recordset[0];

    // Check mandatory fields
    const hasAllDetails =
      profile.full_name &&
      profile.dob &&
      profile.address &&
      profile.pincode;

    if (hasAllDetails) {
      return res.status(201).json({ status : 201, message: true });
    } else {
      return res.status(201).json({ status : 201, message: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ✅ Get user by ID (must be placed after /update-profile)
userRouter.post('/:id', async (req, res) => {
  try {
    await poolConnect;

    //console.log(req.params.id);
    const userId = parseInt(req.params.id);
    const loggedInId = parseInt(req.user?.userId);

    //console.log('userId : ',userId);
    //console.log('loggedInId : ',loggedInId);

    if (!loggedInId || userId !== loggedInId) {
      return res.status(401).json({ status : 401, message: 'Forbidden: Cannot access other user data' });
    }

    const result = await pool.request()
      .input('userId', userId)
      .query("select u.user_id,u.email,u.phone,up.* from users u with(nolock) left join user_profiles up with(nolock) on up.user_id = u.user_id WHERE u.user_id = @userId");

    //console.log(result)
    if (result.recordset.length === 0) {
      return res.status(401).json({ status : 401, message: 'User not found' });
    }

    res.status(201).json({ status:201, message: 'success', result: result.recordset[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status : 500, error: 'Server error' });
  }
});

export default userRouter;
