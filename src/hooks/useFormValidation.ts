import { useState, useCallback } from 'react';

export interface ValidationRules {
  [key: string]: {
    required?: boolean;
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => boolean | string;
    message?: string;
  };
}

export function useFormValidation<T extends Record<string, any>>(initialState: T, rules: ValidationRules) {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((name: string, value: any) => {
    const fieldRules = rules[name];
    if (!fieldRules) return '';

    if (fieldRules.required && (value === undefined || value === null || value === '')) {
      return fieldRules.message || `${name} wajib diisi`;
    }

    if (value !== undefined && value !== null && value !== '') {
      if (fieldRules.pattern && !fieldRules.pattern.test(String(value))) {
        return fieldRules.message || `${name} tidak valid`;
      }
      if (fieldRules.min !== undefined && Number(value) < fieldRules.min) {
        return fieldRules.message || `${name} minimal ${fieldRules.min}`;
      }
      if (fieldRules.max !== undefined && Number(value) > fieldRules.max) {
        return fieldRules.message || `${name} maksimal ${fieldRules.max}`;
      }
      if (fieldRules.minLength !== undefined && String(value).length < fieldRules.minLength) {
        return fieldRules.message || `${name} minimal ${fieldRules.minLength} karakter`;
      }
      if (fieldRules.maxLength !== undefined && String(value).length > fieldRules.maxLength) {
        return fieldRules.message || `${name} maksimal ${fieldRules.maxLength} karakter`;
      }
      if (fieldRules.custom) {
        const customResult = fieldRules.custom(value);
        if (customResult !== true) {
          return typeof customResult === 'string' ? customResult : (fieldRules.message || `${name} tidak valid`);
        }
      }
    }
    return '';
  }, [rules]);

  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => {
      const newValues = { ...prev, [name]: value };
      return newValues;
    });
    
    setErrors(prev => {
      const error = validateField(name, value);
      if (!error && !prev[name]) return prev;
      return { ...prev, [name]: error };
    });
  }, [validateField]);

  const validateAll = useCallback(() => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    Object.keys(rules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  }, [rules, values, validateField]);

  const resetForm = useCallback((newValues?: T) => {
    setValues(newValues || initialState);
    setErrors({});
  }, [initialState]);

  return { values, errors, handleChange, validateAll, resetForm, setValues, setErrors };
}
