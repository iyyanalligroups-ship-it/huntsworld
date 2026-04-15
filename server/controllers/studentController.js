const Student = require("../models/studentModel");
const Address = require("../models/addressModel");
const mongoose = require("mongoose");
const Role = require("../models/roleModel");
const User = require("../models/userModel");
const UserSubscription = require("../models/userSubscriptionPlanModel");
const UserActiveFeature = require("../models/UserActiveFeature");
const { checkDuplicates } = require("../utils/duplicateCheck");
const { getSyncVerificationFlags } = require("../utils/verificationSync");

// Create a new student
const createStudent = async (req, res) => {
  try {
    const { college_email, user_id } = req.body;

    // GLOBAL DUPLICATE CHECK
    if (college_email) {
      const duplicateStatus = await checkDuplicates({
        email: college_email,
        userId: user_id
      });
      if (duplicateStatus.exists) {
        return res.status(400).json({ message: duplicateStatus.message });
      }
    }

    const student = new Student(req.body);

    // Cross-model verification sync
    const verificationFlags = await getSyncVerificationFlags(user_id, college_email, null);
    student.email_verified = verificationFlags.email_verified;

    await student.save();

    // Admin notification
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.notifyNewRegistration("student", {
        _id: student._id,
        college_name: student.college_name,
        college_email: student.college_email,
        created_at: student.createdAt
      });
    }

    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all students — with user names and addresses in 3 queries instead of N+1
const getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ markAsRead: 1, createdAt: -1 }).lean();

    if (!students.length) return res.json([]);

    const userIds = students.map((s) => s.user_id);

    // Batch fetch: all company addresses + all user names in parallel (2 extra queries)
    const [addresses, users] = await Promise.all([
      Address.find({
        user_id: { $in: userIds },
        entity_type: "student",
        address_type: "company",
      }).lean(),
      User.find({ _id: { $in: userIds } }).select("_id name isActive").lean(),
    ]);

    // Build lookup maps for O(1) access
    const addressMap = {};
    addresses.forEach((a) => { addressMap[a.user_id.toString()] = a; });

    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const studentsWithDetails = [];

    students.forEach((student) => {
      const uid = student.user_id?.toString();
      if (uid && userMap[uid]) {
        studentsWithDetails.push({
          ...student,
          address: addressMap[uid] || null,
          name: userMap[uid].name,
          isActive: userMap[uid].isActive,
        });
      }
    });

    res.json(studentsWithDetails);
  } catch (error) {
    console.error("Error fetching students with address:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get student by ID — student + address fetched in parallel
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch address and user name in parallel
    const [address, userDoc] = await Promise.all([
      Address.findOne({
        user_id: student.user_id,
        entity_type: "student",
        address_type: "company",
      }).lean(),
      User.findById(student.user_id).select("name isActive email phone").lean(),
    ]);

    res.json({
      ...student,
      address,
      name: userDoc?.name || "N/A",
      user_email: userDoc?.email || "Not provided",
      user_phone: userDoc?.phone || "No phone available",
      isActive: userDoc?.isActive ?? true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getStudentByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const student = await Student.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.college_email === "") {
      updateData.college_email = undefined;
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (updateData.college_email && updateData.college_email !== student.college_email) {
      const duplicateStatus = await checkDuplicates({
        email: updateData.college_email,
        userId: student.user_id,
        excludeModel: "Student",
        excludeId: student._id
      });
      if (duplicateStatus.exists) {
        return res.status(400).json({ message: duplicateStatus.message });
      }
    }

    Object.assign(student, updateData);

    // Cross-model verification sync on update
    const verificationFlags = await getSyncVerificationFlags(student.user_id, student.college_email, null);
    student.email_verified = verificationFlags.email_verified;

    await student.save();
    res.json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "College email already exists" });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find the student first
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 2️⃣ Find the "USER" role from Roles collection
    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole) {
      return res
        .status(404)
        .json({ message: "User role not found in Roles collection" });
    }

    // 3️⃣ Update the related user's role to "USER"
    await User.findByIdAndUpdate(student.user_id, { role: userRole._id });

    // 4️⃣ Delete the student record
    await Student.findByIdAndDelete(id);

    // 5️⃣ Respond with success
    res.json({
      statusCode: 200,
      success: true,
      message: "Student deleted and user role updated to USER",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: error.message || "Failed to delete student",
    });
  }
};

const updateStudentByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { college_email, college_name, university_name, id_card } = req.body;
    
    // college_email is now optional
    if (!college_name || !university_name) {
      return res.status(400).json({ message: "Required fields (College Name, University Name) are missing" });
    }

    // Prepare update object, handling empty string for email
    const updateFields = { 
      college_name, 
      university_name, 
      id_card, 
      verified: false 
    };
    
    if (college_email === "" || college_email === null) {
      updateFields.college_email = undefined;
    } else if (college_email) {
      const student = await Student.findOne({ user_id: userId });
      
      const duplicateStatus = await checkDuplicates({
        email: college_email,
        userId: userId,
        excludeModel: "Student",
        excludeId: student ? student._id : undefined
      });
      if (duplicateStatus.exists) {
        return res.status(400).json({ message: duplicateStatus.message });
      }
      updateFields.college_email = college_email;
    }

    const student = await Student.findOneAndUpdate(
      { user_id: userId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ Allowed editable fields only
    const allowedFields = [
      "college_email",
      "college_name",
      "university_name",
      "id_card",
      "college_start_month_year",
      "college_end_month_year",
      "address_id",
    ];

    let isModified = false;

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        if (student[key]?.toString() !== req.body[key]?.toString()) {
          student[key] = req.body[key];
          isModified = true;
        }
      }
    });

    // 🔥 Reset verification only if something changed
    if (isModified) {
      student.verified = false;
    }

    // Cross-model verification sync on update (by userId)
    const verificationFlags = await getSyncVerificationFlags(userId, student.college_email, null);
    student.email_verified = verificationFlags.email_verified;

    await student.save();

    res.status(200).json({
      message: "Student details updated successfully",
      student,
    });

  } catch (error) {
    console.error("Error updating student:", error);

    // Handle duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        message: "College email already exists",
      });
    }

    res.status(500).json({ message: error.message });
  }
};
const createStudentProfile = async (req, res) => {
  try {
    const {
      user_id,
      college_email,
      college_name,
      id_card,
      university_name,
      college_start_month_year,
      college_end_month_year,
    } = req.body;
    // Validate required fields
    if (
      !user_id ||
      !college_name ||
      !id_card ||
      !university_name ||
      !college_start_month_year ||
      !college_end_month_year
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // Validate user_id format
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user_id format" });
    }

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if student profile already exists for this user
    const existingStudent = await Student.findOne({ user_id });
    if (existingStudent) {
      return res
        .status(400)
        .json({ message: "Student profile already exists for this user" });
    }

    // Check for duplicate college email ONLY if provided
    if (college_email) {
      const duplicateStatus = await checkDuplicates({
        email: college_email,
        userId: user_id
      });
      if (duplicateStatus.exists) {
        return res.status(400).json({ message: duplicateStatus.message });
      }
    }

    // Find the STUDENT role
    const studentRole = await Role.findOne({ role: "STUDENT" });
    if (!studentRole) {
      return res.status(404).json({ message: "STUDENT role not found" });
    }
    // Create new student profile
    const student = new Student({
      user_id,
      id_card,
      college_email: college_email || undefined,
      college_name,
      university_name,
      college_start_month_year,
      college_end_month_year,
      verified: false,
    });

    // Cross-model verification sync
    const verificationFlags = await getSyncVerificationFlags(user_id, college_email, null);
    student.email_verified = verificationFlags.email_verified;

    await student.save();

    // Admin notification
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.notifyNewRegistration("student", {
        _id: student._id,
        college_name: student.college_name,
        college_email: student.college_email,
        created_at: student.createdAt
      });
    }
    // Update user's role to STUDENT
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { role: studentRole._id, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      await Student.findByIdAndDelete(student._id);
      return res
        .status(404)
        .json({ message: "User not found during role update" });
    }
    res.status(201).json({
      message: "Student profile created successfully, please log in again",
      student,
      requiresLogout: true,
    });
  } catch (error) {
    console.error("Error creating student profile:", error);
    res
      .status(500)
      .json({
        message: "Server error while creating student profile",
        error: error.message,
      });
  }
};

const createMinimalStudentByUserId = async (req, res) => {
  try {
    const {
      user_id,
      college_name,
      college_email,
      university_name,
      college_start_month_year,
      college_end_month_year,
    } = req.body;

    // Validate required fields
    if (
      !user_id ||
      !college_name ||
      !university_name ||
      !college_start_month_year ||
      !college_end_month_year
    ) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "All required fields must be provided",
      });
    }

    // Validate user exists and has role USER
    const user = await User.findById(user_id).populate("role");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "User not found",
      });
    }

    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole || user.role._id.toString() !== userRole._id.toString()) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "User must have the USER role to be converted to STUDENT",
      });
    }

    // Check if student already exists for this user
    const existingStudent = await Student.findOne({ user_id });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Student profile already exists for this user",
      });
    }

    // Validate college_email uniqueness → 409 Conflict ONLY if provided
    if (college_email) {
      const duplicateStatus = await checkDuplicates({
        email: college_email,
        userId: user_id
      });
      if (duplicateStatus.exists) {
        return res.status(409).json({
          success: false,
          error: true,
          message: duplicateStatus.message,
        });
      }
    }

    // Find STUDENT role
    const studentRole = await Role.findOne({ role: "STUDENT" });
    if (!studentRole) {
      return res.status(500).json({
        success: false,
        error: true,
        message: "STUDENT role not found",
      });
    }

    // Create new Student
    const newStudent = new Student({
      user_id,
      college_name,
      college_email: college_email || undefined,
      university_name,
      college_start_month_year: new Date(college_start_month_year),
      college_end_month_year: new Date(college_end_month_year),
      verified: false,
    });

    // Cross-model verification sync (minimal)
    const verificationFlags = await getSyncVerificationFlags(user_id, college_email, null);
    newStudent.email_verified = verificationFlags.email_verified;

    await newStudent.save();

    // Admin notification
    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.notifyNewRegistration("student", {
        _id: newStudent._id,
        college_name: newStudent.college_name,
        college_email: newStudent.college_email,
        created_at: newStudent.createdAt
      });
    }

    // Update user role to STUDENT
    user.role = studentRole._id;
    await user.save();

    res.status(201).json({
      success: true,
      error: false,
      message: "Student created and user role updated successfully",
      data: newStudent,
    });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({
      success: false,
      error: true,
      message: "Error creating student",
      details: error.message,
    });
  }
};

const markStudentAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndUpdate(id, { markAsRead: true }, { new: true });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Also mark the associated User as read to clear global notifications
    if (student.user_id) {
      await User.findByIdAndUpdate(student.user_id, { markAsRead: true });
    }

    const adminHelpers = req.app.get("adminSocketHelpers");
    if (adminHelpers) {
      await adminHelpers.updateUnreadCount();
    }

    res.status(200).json({ success: true, message: "Student marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error marking student as read", error: error.message });
  }
};
const verifyStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (typeof verified !== "boolean") {
      return res.status(400).json({ message: "verified must be a boolean" });
    }

    const student = await Student.findByIdAndUpdate(
      id,
      { verified },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Verification status updated", student });
  } catch (error) {
    console.error("Verify student error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Toggle student verified status
const toggleStudentVerifiedStatus = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Toggle verified field
    student.verified = !student.verified;
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student verification status updated to ${student.verified ? "Verified" : "Unverified"
        }`,
      verified: student.verified,
    });
  } catch (error) {
    console.error("Error toggling verified status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// DELETE Student by user_id
// const deleteStudentByUserId = async (req, res) => {
//   try {
//     const { user_id } = req.params;

//     if (!user_id) {
//       return res.status(400).json({ message: "User ID is required" });
//     }

//     // 1. Find the student before deleting (to get id_card)
//     const student = await Student.findOne({ user_id });
//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     let extractedCollegeName = null;

//     if (student.id_card) {
//       // Extract file name from URL
//       const filename = student.id_card.split("/").pop();
//       // Example: 5588_1763809873574_Western_Valley_Business_School_logo.webp

//       // Remove the numeric prefix → Keep only actual college name part
//       // Remove ".*?_" from start → remove multiple numeric-with-underscores
//       const cleaned = filename.replace(/^\d+_\d+_/, "");
//       // Now: Western_Valley_Business_School_logo.webp

//       // Remove "_logo.webp"
//       const withoutSuffix = cleaned.replace(/_logo\.webp$/, "");
//       // Now: Western_Valley_Business_School

//       // Convert underscores → spaces
//       extractedCollegeName = withoutSuffix.replace(/_/g, " ");
//     }

//     // 2. Delete student record
//     const deletedStudent = await Student.findOneAndDelete({ user_id });

//     // 3. Get USER role
//     const userRole = await Role.findOne({ role: "USER" });
//     if (!userRole) {
//       return res.status(500).json({ message: "USER role not found" });
//     }

//     // 4. Update user's role
//     const updatedUser = await User.findByIdAndUpdate(
//       user_id,
//       { role: userRole._id },
//       { new: true }
//     );

//     return res.status(200).json({
//       message: "Student profile deleted & user role updated successfully",
//       student: deletedStudent,
//       user: updatedUser,
//       extractedCollegeName, // <-- SEND THIS TO FRONTEND
//     });
//   } catch (error) {
//     console.error("Delete Student Error:", error);
//     res.status(500).json({ message: "Server error while deleting student" });
//   }
// };

// DELETE Student by user_id

const deleteStudentByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // 1. Find student before deleting
    const student = await Student.findOne({ user_id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let extractedCollegeName = null;

    if (student.id_card) {
      const filename = student.id_card.split("/").pop();
      const cleaned = filename.replace(/^\d+_\d+_/, "");
      const withoutSuffix = cleaned.replace(/_logo\.webp$/, "");
      extractedCollegeName = withoutSuffix.replace(/_/g, " ");
    }

    // 2. Delete student record
    const deletedStudent = await Student.findOneAndDelete({ user_id });

    // 3. Get USER role
    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole) {
      return res.status(500).json({ message: "USER role not found" });
    }

    // 4. Update user with USER role
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { role: userRole._id },
      { new: true }
    ).populate("role");

    // ------------------------------
    // 5. CREATE userResponse OBJECT
    // ------------------------------
    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      referral_code: updatedUser.referral_code,
      referred_by: updatedUser.referred_by || null,
      email: updatedUser.email,
      role: updatedUser.role,                     // populated role object
      number_otp: updatedUser.number_otp || null,
      number_verified: updatedUser.number_verified || false,
      email_otp: updatedUser.email_otp || null,
      email_verified: updatedUser.email_verified,
      created_at: updatedUser.created_at,
      hasSentOneTimeMessage: updatedUser.hasSentOneTimeMessage || false,
      updated_at: updatedUser.updated_at,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      __v: updatedUser.__v,
      gender: updatedUser.gender,
      phone: updatedUser.phone,
      profile_pic: updatedUser.profile_pic || null,
    };

    // ------------------------------
    // 6. GENERATE NEW TOKEN
    // ------------------------------
    const newToken = jwt.sign(
      { userId: updatedUser._id, role: updatedUser.role.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ------------------------------
    // 7. SEND RESPONSE
    // ------------------------------
    return res.status(200).json({
      success: true,
      message: "Student profile deleted & role changed to USER",
      extractedCollegeName,
      user: userResponse,     // full structured user
      token: newToken,        // updated JWT
      student: deletedStudent // optional
    });

  } catch (error) {
    console.error("Delete Student Error:", error);
    return res.status(500).json({ message: "Server error while deleting student" });
  }
};
const deactivateStudentAccount = async (req, res) => {
  const { user_id } = req.params;

  try {
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    // 1️⃣ Delete Student record
    const student = await Student.findOneAndDelete({ user_id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found",
      });
    }

    // 2️⃣ Find USER role
    const userRole = await Role.findOne({ role: "USER" });
    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: "USER role not found in the system",
      });
    }

    // 3️⃣ Revert user role
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      {
        role: userRole._id,
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 4️⃣ Delete company addresses
    const deletedCompanyAddresses = await Address.deleteMany({
      user_id,
      address_type: "company",
    });

    return res.status(200).json({
      success: true,
      message:
        "Student account deactivated. Company addresses deleted. User reverted to normal USER.",
      data: {
        deletedCompanyAddresses: deletedCompanyAddresses.deletedCount,
      },
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error deactivating student account:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error. Please try again later.",
    });
  }
};

module.exports = {
  verifyStudent,
  deleteStudentByUserId,
  createMinimalStudentByUserId,
  createStudentProfile,
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentByUserId,
  getStudentByUserId,
  markStudentAsRead,
  deactivateStudentAccount,
  toggleStudentVerifiedStatus,
  deleteStudent,
};
