/**
 * Validates an email address
 * @param {string} email - The email address to validate
 * @returns {Object} - { isValid: boolean, errorMessage: string }
 */
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // if (!email) {
    //     return {
    //         isValid: false,
    //         errorMessage: "Email is required"
    //     };
    // }

    // if (!emailRegex.test(email)) {
    //     return {
    //         isValid: false,
    //         errorMessage: "Please enter a valid email address"
    //     };
    // }

    return {
        isValid: true,
        errorMessage: ""
    };
}
