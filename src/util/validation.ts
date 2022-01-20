import { isAfter, isBefore, isValid, parse } from 'date-fns';

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
    return isValid(parse(dateString, 'yyyy-MM-dd', new Date()));
};

const validateDateTime = (dateTimeString: string): boolean => {
    return isValid(parse(dateTimeString, 'yyyy-MM-dd HH:mm', new Date()));
};

const validateDateRange = (startDate: string, endDate: string): boolean => {
    if (!validateDate(startDate)) {
        return false;
    }
    if (!validateDate(endDate)) {
        return false;
    }

    return isAfter(
        parse(endDate, 'yyyy-MM-dd', new Date()),
        parse(startDate, 'yyyy-MM-dd', new Date())
    );
};

const validateAddress = (address: AddressInput): boolean => {
    // TODO: Implement validation function
    return true;
};

const validateCurrency = (value: string): boolean => {
    const currencyRegex = /^\d+\.\d{2}$/;
    return currencyRegex.test(value);
};

const validateDateInRange = (
    testDate: string,
    startDate: string,
    endDate: string
) => {
    const parsedTestDate = parse(testDate, 'yyyy-MM-dd', new Date());
    const parsedStartDate = parse(startDate, 'yyyy-MM-dd', new Date());
    const parsedEndDate = parse(endDate, 'yyyy-MM-dd', new Date());

    return !(
        isBefore(parsedTestDate, parsedStartDate) ||
        isAfter(parsedTestDate, parsedEndDate)
    );
};

export {
    validateEmail,
    validateColor,
    validateRecordName,
    validateDate,
    validateAddress,
    validateCurrency,
    validateDateRange,
    validateDateInRange,
    validateDateTime,
};
