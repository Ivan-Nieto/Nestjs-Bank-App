// True if parameter is not a valid object
export const notObject = (obj: any) => {
  return typeof obj !== 'object' || Array.isArray(obj);
};

// True if parameter is not a valid string or is an empty string
export const invalidString = (str?: any) => {
  return !Boolean(str) || typeof str !== 'string';
};

// True if parameter is not a valid number
export const invalidNumber = (num?: any) => {
  return num == null || typeof num !== 'number';
};
