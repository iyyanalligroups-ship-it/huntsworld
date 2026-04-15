const express = require('express');
const { verifyStudent, markStudentAsRead, createMinimalStudentByUserId, deleteStudentByUserId, createStudentProfile, toggleStudentVerifiedStatus, deactivateStudentAccount, createStudent, getStudents, getStudentById, updateStudent, getStudentByUserId, updateStudentByUserId, deleteStudent } = require('../controllers/studentController');
const router = express.Router();
router.post('/create-students', createStudent);
router.get('/fetch-students', getStudents);
router.get("/fetch-student-user-id/:userId", getStudentByUserId);
router.get('/fetch-students-by-id/:id', getStudentById);
router.put('/update-students-by-id/:id', updateStudent);
router.post('/create-student-profile', createStudentProfile);
router.put("/update-student/:userId", updateStudentByUserId);
router.delete('/delete-students-by-id/:id', deleteStudent);
router.post('/create-students-by-userid', createMinimalStudentByUserId);
router.patch('/verify/:id', verifyStudent);
router.patch("/toggle/:studentId", toggleStudentVerifiedStatus);
router.delete(
  "/delete-student-by-user-id/:user_id",
  deleteStudentByUserId
);
router.delete('/deactivate-account/:user_id', deactivateStudentAccount);
router.patch('/mark-read/:id', markStudentAsRead);

module.exports = router;
