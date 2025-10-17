class Validations {
  // Validate email format
  EmailValidation(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password (min 8 chars, at least 1 letter & 1 number)
  PasswordValidation(pwd) {
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    return pwdRegex.test(pwd);
  }

  // Validate phone (Indian 10-digit numbers)
  PhoneValidation(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  OTPValidation(otp) {
    const otpRegex = /^[0-9]{6}$/;
    return otpRegex.test(otp);
  }

  NameValidation(name) {
    const nameRegex = /^[A-Za-z\s]{3,20}$/;
    return nameRegex.test(name.trim());
  }

  DOBValidation(dob) {
    if (!dob) return false;
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Adjust if birthday hasn’t occurred yet this year
    const is18OrOlder =
      age > 18 ||
      (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));

    return is18OrOlder;
  }

  // ✅ Validate Address (min 6 chars, max 30)
  AddressValidation(address) {
    if (!address) return false;
    const trimmed = address.trim();
    return trimmed.length >= 6 && trimmed.length <= 50;
  }

  // ✅ Validate Pincode (exactly 6 digits)
  PincodeValidation(pincode) {
    const pincodeRegex = /^[0-9]{6}$/;
    return pincodeRegex.test(pincode);
  }
}

export default Validations;
