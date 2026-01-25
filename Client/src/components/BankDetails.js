import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBankDetailsAPI } from "../apis/bank/getBankDetailsAPI";
import { updateBankDetailsAPI } from "../apis/bank/updateBankDetailsAPI";
import { toast } from "react-toastify";

export default function BankDetails() {
    const navigate = useNavigate();

    const [user_id,setUserId] = useState(0);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

    const [form, setForm] = useState({
      acc_number: "",
      confirm_acc_number: "",
      bank_name: "",
      IFSC_code: "",
      mobile: "",
      branch_name: "",
      pincode: "",
      is_upi_available: false,
    });

    const [errors, setErrors] = useState({});

    // Get user_id and token from localstorage/sessionstorage
    useEffect(() => {
        let userId = sessionStorage.getItem('userId');
        // If not found in session, check localStorage
        if (!userId) {
          userId = localStorage.getItem('userId');
        }
      
        if (!userId) {
          navigate('../login');
          return;
        }
    
        setUserId(userId);
    
        let tok = sessionStorage.getItem('token');
        // If not found in session, check localStorage
        if (!tok) {
          tok = localStorage.getItem('token');
        }
      
        if (!tok) {
          navigate('../login');
          return;
        }
    
        setToken(tok);
    }, []);

  // ---------------------------
  // API CALLS
  // ---------------------------
  const fetchBankDetails = async () => {
    try {
      const res = await getBankDetailsAPI(token, user_id);
      if (res.status==201 && res.hasBankDetails) {
        setForm({
          ...res.data,
          confirm_acc_number: res.data.acc_number,
        });
      } else if (res.status === 403) {
        toast.error(res.message);
        navigate('/403');
      } else if (res.status === 401) {
        toast.error(res.message);
        navigate('/401');
      } else {
        toast.error(res.message)
      }
    } catch (err) {
        console.error(err);
        if(err?.status === 403) {
            navigate('/403');
        }
        if(err?.status === 401) {
            navigate('/401');
        }
        if(err?.status === 500) {
          navigate('/500')
        }
    } finally {
        setLoading(false);
    }
  };

  const updateBankDetails = async () => {
    try{    
        const payload = {
          user_id: user_id,
          acc_number: form.acc_number,
          bank_name: form.bank_name,
          IFSC_code: form.IFSC_code,
          mobile: form.mobile,
          branch_name: form.branch_name,
          pincode: form.pincode,
          is_upi_available: form.is_upi_available,
        };

        const res = await updateBankDetailsAPI(token, payload);

        if(res.status==201){
            toast.success(res.message);
        } else if (res.status === 403) {
          toast.error(res.message);
          navigate('/403');
        } else if (res.status === 401) {
          toast.error(res.message);
          navigate('/401');
        } else {
          toast.error(res.message)
        }
    } catch (err) {
        console.error("Error updating bank details:", err);
        toast.error(err.error || "Failed to update bank details. Please try again.");
        if(err?.status === 403) {
          navigate('/403');
        }
        if(err?.status === 401) {
          navigate('/401');
        }
        if(err?.status === 500) {
          navigate('/500')
        }
    } finally {
        setEditMode(false);
    }
  };

  // ---------------------------
  // VALIDATION
  // ---------------------------
  const validate = () => {
    let err = {};

    if (!form.acc_number) err.acc_number = "Account number required";
    if (!form.confirm_acc_number) err.confirm_acc_number = "Confirm account number";
    if (form.acc_number !== form.confirm_acc_number)
      err.confirm_acc_number = "Account numbers do not match";

    if (!form.bank_name) err.bank_name = "Bank name required";
    if (!form.IFSC_code) err.IFSC_code = "IFSC required";
    if (!form.mobile) err.mobile = "Mobile required";
    if (!/^\d{6}$/.test(form.pincode)) err.pincode = "Pincode must be 6 digits";

    return err;
  };

  // ---------------------------
  // HANDLERS
  // ---------------------------
  const onSave = async () => {
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    updateBankDetails();
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if( user_id != 0 && token != ''){
        fetchBankDetails();
    }
  }, [user_id, token]);

  if (loading) return <h2>Loading...</h2>;

  return (
    <div className="bank-card">
        <div className="bank-title-button-card">
            <h2>Bank Details</h2>
            {/* ACTION BUTTONS */}
            <div className="btn-row">
              {!editMode ? (
                <button className="edit-btn" onClick={() => setEditMode(true)}>
                  Edit
                </button>
              ) : (
                <button className="save-btn" onClick={onSave}>
                  Save
                </button>
              )}
            </div>
        </div>

      {/* Account Number */}
      <div className="input-group">
        <label>Account Number</label>
        <input
          disabled={!editMode}
          value={form.acc_number}
          onChange={(e) => handleChange("acc_number", e.target.value)}
        />
        {errors.acc_number && <p className="error">{errors.acc_number}</p>}
      </div>

      {/* Confirm Account Number */}
      {editMode && (
        <div className="input-group">
          <label>Confirm Account Number</label>
          <input
            disabled={!editMode}
            value={form.confirm_acc_number}
            onChange={(e) => handleChange("confirm_acc_number", e.target.value)}
          />
          {errors.confirm_acc_number && (
            <p className="error">{errors.confirm_acc_number}</p>
          )}
        </div>
      )}

      {/* Bank Name */}
      <div className="input-group">
        <label>Bank Name</label>
        <input
          disabled={!editMode}
          value={form.bank_name}
          onChange={(e) => handleChange("bank_name", e.target.value)}
        />
        {errors.bank_name && <p className="error">{errors.bank_name}</p>}
      </div>

      {/* IFSC */}
      <div className="input-group">
        <label>IFSC Code</label>
        <input
          disabled={!editMode}
          value={form.IFSC_code}
          onChange={(e) => handleChange("IFSC_code", e.target.value)}
        />
        {errors.IFSC_code && <p className="error">{errors.IFSC_code}</p>}
      </div>

      {/* Branch Name */}
      <div className="input-group">
        <label>Branch Name</label>
        <input
          disabled={!editMode}
          value={form.branch_name}
          onChange={(e) => handleChange("branch_name", e.target.value)}
        />
      </div>

      {/* Pincode */}
      <div className="input-group">
        <label>Pincode</label>
        <input
          disabled={!editMode}
          value={form.pincode}
          onChange={(e) => handleChange("pincode", e.target.value)}
        />
        {errors.pincode && <p className="error">{errors.pincode}</p>}
      </div>

      {/* Mobile */}
      <div className="input-group">
        <label>Mobile</label>
        <input
          disabled={!editMode}
          value={form.mobile}
          onChange={(e) => handleChange("mobile", e.target.value)}
        />
        {errors.mobile && <p className="error">{errors.mobile}</p>}
      </div>

      {/* UPI Toggle */}
      <div className="toggle-row">
        <span>UPI Available</span>
        <label className="switch">
          <input
            type="checkbox"
            disabled={!editMode}
            checked={form.is_upi_available}
            onChange={(e) =>
              handleChange("is_upi_available", e.target.checked)
            }
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}