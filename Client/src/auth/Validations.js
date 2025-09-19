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
}

export default Validations;
