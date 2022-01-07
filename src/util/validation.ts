import { AddressInput } from '../types/generated/graphql';

const validateEmail = (email: string): boolean => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
};

const validateColor = (color: string): boolean => {
    const colorRegex = /^#[\dA-F]{6}$/;
    return colorRegex.test(color);
};

const validateRecordName = (recordName: string): boolean => {
    return recordName.length >= 3;
};

const validateDate = (dateString: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(dateString);
};

const validateAddress = (address: AddressInput): boolean => {
    // TODO: Implement validation function
    return true;
};

const validateCurrency = (value: string): boolean => {
    const currencyRegex = /^\d+\.\d{2}$/;
    return currencyRegex.test(value);
};

export {
    validateEmail,
    validateColor,
    validateRecordName,
    validateDate,
    validateAddress,
    validateCurrency,
};
