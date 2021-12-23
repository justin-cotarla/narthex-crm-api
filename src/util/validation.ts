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

export { validateEmail, validateColor, validateRecordName };
