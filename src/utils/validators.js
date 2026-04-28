/**
 * Global validators for Admin forms
 */

export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const isValidPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone);
};

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidIFSC = (ifsc) => {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
};

export const isValidUPI = (upi) => {
  return /^[\w.-]+@[\w.-]+$/.test(upi);
};
