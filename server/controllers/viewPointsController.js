const ViewPoints = require('../models/viewPointsModel');

// Create a new View Point entry
exports.createViewPoint = async (req, res) => {
  try {
    const { user_id, view_points = 10 } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "user_id is required" });
    }

    const viewPoint = await ViewPoints.create({ user_id, view_points });

    res.status(201).json({
      success: true,
      message: "View point added successfully",
      data: viewPoint,
    });
  } catch (error) {
    console.error("Error creating view point:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all View Points
exports.getAllViewPoints = async (req, res) => {
    try {
        const viewPoints = await ViewPoints.find();
        res.json(viewPoints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a specific View Point by ID
exports.getViewPointByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    

    const viewPoint = await ViewPoints.findOne({ user_id: userId }); // match by field
    if (!viewPoint) {
      return res.status(404).json({ message: "View Point not found" });
    }

    res.status(200).json({ data: viewPoint });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update a View Point entry (atomic increment to prevent race conditions)
exports.updateViewPoint = async (req, res) => {
  try {
    const { user_id, view_points } = req.body;

    if (!user_id || view_points === undefined) {
      return res.status(400).json({ message: "user_id and view_points are required" });
    }

    const increment = Number(view_points);
    if (isNaN(increment) || increment <= 0) {
      return res.status(400).json({ message: "view_points must be a positive number" });
    }

    // ✅ Atomic upsert — avoids race condition from read-modify-write
    const viewPoint = await ViewPoints.findOneAndUpdate(
      { user_id },
      { $inc: { view_points: increment } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );


    return res.json({
      success: true,
      message: "View point updated",
      data: viewPoint,
    });
  } catch (error) {
    console.error("Error in updateViewPoint:", error);
    return res.status(500).json({ error: error.message });
  }
};


// Delete a View Point entry
exports.deleteViewPoint = async (req, res) => {
    try {
        const viewPoint = await ViewPoints.findByIdAndDelete(req.params.id);
        if (!viewPoint) return res.status(404).json({ message: "View Point not found" });

        res.json({ message: "View Point deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
