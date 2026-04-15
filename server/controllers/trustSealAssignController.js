const mongoose = require('mongoose');
const TrustSealAssignment = require('../models/trustSealAssignModel');
const TrustSealRequest = require('../models/trustSealRequestModel');
const User = require('../models/userModel');

class TrustSealAssignmentController {
  // Assign a trust seal request to a student
  static async assign(req, res) {
    try {
      const { request_id, student_id, assigned_by } = req.body;

      if (!request_id || !student_id || !assigned_by) {
        return res.status(400).json({
          success: false,
          message: 'request_id, student_id, and assigned_by are required',
        });
      }

      // Validate ObjectIds
      if (
        !mongoose.Types.ObjectId.isValid(request_id) ||
        !mongoose.Types.ObjectId.isValid(student_id) ||
        !mongoose.Types.ObjectId.isValid(assigned_by)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ID format',
        });
      }

      // Check if request exists and is pending
      const request = await TrustSealRequest.findById(request_id);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Trust seal request not found',
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Can only assign pending requests',
        });
      }

      // Verify student has STUDENT role
      const student = await User.findById(student_id).populate('role');
      if (!student || student.role?.role !== 'STUDENT') {
        return res.status(400).json({
          success: false,
          message: 'Invalid or non-student user',
        });
      }

      // Prevent duplicate assignment
      const existing = await TrustSealAssignment.findOne({ request_id });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This request is already assigned',
        });
      }

      // Create assignment
      const assignment = new TrustSealAssignment({
        request_id,
        student_id,
        assigned_by,
      });
      await assignment.save();

      // Update request status & picked_by
      request.status = 'in_process';
      request.picked_by = student_id;
      await request.save();

      res.status(201).json({
        success: true,
        message: 'Trust seal request assigned successfully',
        data: {
          assignment,
          request: {
            _id: request._id,
            status: request.status,
            picked_by: request.picked_by,
          },
        },
      });
    } catch (error) {
      console.error('Assign Trust Seal Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign trust seal request',
        error: error.message,
      });
    }
  }

  // Get all assignments (useful for admin dashboard)
  static async getAllAssignments(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const query = status ? { status } : {};
      const skip = (page - 1) * limit;

      const assignments = await TrustSealAssignment.find(query)
        .populate('request_id', 'user_id amount status')
        .populate('student_id', 'name email phone')
        .populate('assigned_by', 'name email')
        .skip(skip)
        .limit(Number(limit))
        .sort({ assigned_at: -1 });

      const total = await TrustSealAssignment.countDocuments(query);

      res.status(200).json({
        success: true,
        data: assignments,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit),
          limit: Number(limit),
        },
      });
    } catch (error) {
      console.error('Get Assignments Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignments',
        error: error.message,
      });
    }
  }

  // Get assignments for a specific request
  static async getByRequest(req, res) {
    try {
      const { request_id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(request_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request ID',
        });
      }

      const assignment = await TrustSealAssignment.findOne({ request_id })
        .populate('student_id', 'name email phone')
        .populate('assigned_by', 'name email');

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'No assignment found for this request',
        });
      }

      res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assignment',
        error: error.message,
      });
    }
  }
  // Reassign a trust seal request to a different student
  static async reassign(req, res) {
    try {
      const { request_id, student_id, assigned_by } = req.body;

      if (!request_id || !student_id || !assigned_by) {
        return res.status(400).json({
          success: false,
          message: 'request_id, student_id, and assigned_by are required',
        });
      }

      // Verify student has STUDENT role
      const student = await User.findById(student_id).populate('role');
      if (!student || student.role?.role !== 'STUDENT') {
        return res.status(400).json({
          success: false,
          message: 'Invalid or non-student user',
        });
      }

      // Find existing assignment
      const assignment = await TrustSealAssignment.findOne({ request_id });
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'No assignment found for this request. Use assign instead.',
        });
      }

      // Update assignment
      assignment.student_id = student_id;
      assignment.assigned_by = assigned_by;
      assignment.assigned_at = Date.now();
      await assignment.save();

      // Update request picked_by
      const request = await TrustSealRequest.findById(request_id);
      if (request) {
        request.picked_by = student_id;
        await request.save();
      }

      res.status(200).json({
        success: true,
        message: 'Trust seal request reassigned successfully',
        data: assignment,
      });
    } catch (error) {
      console.error('Reassign Trust Seal Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reassign trust seal request',
        error: error.message,
      });
    }
  }

  // Unassign a trust seal request
  static async unassign(req, res) {
    try {
      const { request_id } = req.params;

      if (!request_id || !mongoose.Types.ObjectId.isValid(request_id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid request_id is required',
        });
      }

      // Delete the assignment
      const deleted = await TrustSealAssignment.findOneAndDelete({ request_id });
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'No assignment found for this request',
        });
      }

      // Reset request status and picked_by
      const request = await TrustSealRequest.findById(request_id);
      if (request) {
        request.status = 'pending';
        request.picked_by = null;
        await request.save();
      }

      res.status(200).json({
        success: true,
        message: 'Assignment removed and request reset to pending',
      });
    } catch (error) {
      console.error('Unassign Trust Seal Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unassign trust seal request',
        error: error.message,
      });
    }
  }
}

module.exports = TrustSealAssignmentController;
