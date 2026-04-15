const express = require("express");
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  verifyEmailOtp,
  resendOtp,
  getAllUsersWithUserRole,
  getAllUsersWithMerchantRole,
  getUserByIdSubDealer,
  getChatUsers,
  lookupUser,
  getStudentRole,
  updateUserRoleById,
  searchUserForServiceProvider,
  sendOtp,
  verifyNumberOtp,
  checkUserEmail,
  getUserByIdForChat,
  getUserRoleData,
  getUserNameById,
  resetPassword,
  verifyResetOtp,
  forgotPassword,
  toggleUserStatus,
  getAllAdmins,
  verifyPhoneUpdateOtp,
  resetPasswordPhone,
  getAllRoleUsers,
  updateAllRoleUser,
  getMyReferrals,
  getAuthMe,
  refreshToken,
  getUserBasicDetails,
  changeToUser,
  getUserDisplayName,
  deactivateUserAccount,
  markUserAsRead,
  completeRegistration,
  sendEntityOtp,
  verifyEntityOtp
} = require("../controllers/userController");
const { whoReferredMe, searchReferrer, updateReferrer, deleteReferrer } = require("../controllers/referedby/whoRefered");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post('/register', createUser);
router.post('/login', loginUser);
router.patch('/mark-read/:id', markUserAsRead);
router.get('/all', getAllRoleUsers);
router.put('/update/:id', updateAllRoleUser);
router.get('/fetch-all-users', authMiddleware, getUsers);
router.get('/fetch-all-user-role-data', authMiddleware, getUserRoleData);
router.get('/fetch-user-by-user-id/:user_id', authMiddleware, getChatUsers);
router.get('/fetch-users-by-id/:id', getUserById);
router.get('/fetch-users-by-id-sub-dealer/:id', authMiddleware, getUserByIdSubDealer);
router.put('/update-users-by-id/:id', authMiddleware, updateUser);
router.delete('/delete-users-by-id/:id', authMiddleware, deleteUser);
router.post("/verify-otp", verifyEmailOtp);
router.post("/verify-number-otp", verifyNumberOtp);
router.post("/resend-otp", resendOtp);
router.post("/send-number-otp", sendOtp);
router.post("/send-entity-otp", sendEntityOtp);
router.post("/verify-entity-otp", verifyEntityOtp);
router.get('/lookup', lookupUser);
router.get("/fetch-only-users", getAllUsersWithUserRole);
router.get("/fetch-only-merchants", getAllUsersWithMerchantRole);
router.get('/fetch-student-role', getStudentRole);
router.put('/update-role-by-user-id', updateUserRoleById);
router.get("/check-email/:id", checkUserEmail);
router.get('/search-user-for-service-provider', searchUserForServiceProvider);
router.get('/fetch-users-by-id-for-chat/:id', getUserByIdForChat);
router.get('/fetch-user-name-by-id/:id', getUserNameById);
router.get('/fetch-all-admin-for-help-request', getAllAdmins);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.post('/reset-password-phone', resetPasswordPhone);
router.patch('/toggle-status/:userId', toggleUserStatus);
router.post("/verify-phone-update-otp", verifyPhoneUpdateOtp);
router.get('/my-referrals', authMiddleware, getMyReferrals);
router.get("/me", authMiddleware, getAuthMe);
router.get("/refresh-token", authMiddleware, refreshToken);
router.post("/get-user-basic-details", getUserBasicDetails);
router.patch("/change-to-user/:id", changeToUser);
router.post("/get-user-name", getUserDisplayName);
router.delete("/deactivate-user-account/:user_id", deactivateUserAccount);
router.post("/complete-registration", completeRegistration);
router.get("/who-referred-me", authMiddleware, whoReferredMe);
router.get("/search-referrer", authMiddleware, searchReferrer);
router.put("/update-referrer", authMiddleware, updateReferrer);
router.delete("/delete-referrer", authMiddleware, deleteReferrer);

module.exports = router;
