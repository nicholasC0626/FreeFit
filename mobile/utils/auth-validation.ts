export const validateEmail = (email: string): string | null => {
  const value = email.trim();
  if (!value) {
    return "Email is required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return "Invalid email address";
  }

  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include a number";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a symbol";
  }

  return null;
};

export const validateName = (label: string, value: string): string | null => {
  const text = value.trim();
  if (!text) {
    return `${label} is required`;
  }
  if (text.length > 100) {
    return `${label} must be 100 characters or fewer`;
  }
  return null;
};
