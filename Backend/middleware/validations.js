class Validations {

  // =========================
  // EMAIL
  // =========================
  static EmailValidation(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
  }

  // =========================
  // PASSWORD
  // Min 8 chars, at least:
  // - 1 letter
  // - 1 number
  // - 1 special char
  // =========================
  static PasswordValidation(pwd) {
    if (!pwd) return false;
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    return pwdRegex.test(pwd);
  }

  // =========================
  // PHONE (Indian 10-digit)
  // Starts with 6-9
  // =========================
  static PhoneValidation(phone) {
    if (!phone) return false;
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.trim());
  }

  // =========================
  // OTP (6 digits)
  // =========================
  static OTPValidation(otp) {
    if (!otp) return false;
    const otpRegex = /^[0-9]{6}$/;
    return otpRegex.test(otp);
  }

  // =========================
  // NAME (3-20 chars)
  // =========================
  static NameValidation(name) {
    if (!name) return false;
    const nameRegex = /^[A-Za-z\s]{3,20}$/;
    return nameRegex.test(name.trim());
  }

  // =========================
  // DOB (18+ validation)
  // =========================
  static DOBValidation(dob) {
    if (!dob) return false;

    const birthDate = new Date(dob);
    const today = new Date();

    if (isNaN(birthDate.getTime())) return false;

    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    return (
      age > 18 ||
      (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))
    );
  }

  // =========================
  // ADDRESS (6-50 chars)
  // =========================
  static AddressValidation(address) {
    if (!address) return false;
    const trimmed = address.trim();
    return trimmed.length >= 6 && trimmed.length <= 50;
  }

  // =========================
  // PINCODE (6 digits)
  // =========================
  static PincodeValidation(pincode) {
    if (!pincode) return false;
    const pincodeRegex = /^[0-9]{6}$/;
    return pincodeRegex.test(pincode);
  }

}

export default Validations;