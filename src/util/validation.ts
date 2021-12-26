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

const validateBirthDate = (birthDateString: string): boolean => {
    const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return birthDateRegex.test(birthDateString);
};

export { validateEmail, validateColor, validateRecordName, validateBirthDate };
