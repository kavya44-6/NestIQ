import api from './axiosConfig'

export const loginUser             = (data) => api.post('/auth/login', data)
export const registerUser          = (data) => api.post('/auth/register', data)
export const verifyRegistrationOtp = (email, otp) => api.post('/auth/verify-registration-otp', { email, otp })
export const resendRegistrationOtp = (email) => api.post('/auth/resend-registration-otp', { email })