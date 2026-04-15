const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: 'd:/projects/final-huntsworld/Huntsworld/server/.env' });

const TrendingPointSchema = new mongoose.Schema({
    product_id: mongoose.Schema.Types.ObjectId,
    user_id: mongoose.Schema.Types.ObjectId,
    trending_points: Number
}, { collection: 'trendingpoints' });

const TrendingPoint = mongoose.model('TrendingPoint', TrendingPointSchema);

async function checkPoints() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");
        
        const count = await TrendingPoint.countDocuments({});
        console.log("Total TrendingPoint documents:", count);
        
        if (count > 0) {
            const allPoints = await TrendingPoint.find({}).limit(5);
            console.log("Sample Points:", JSON.stringify(allPoints, null, 2));
            
            const sum = await TrendingPoint.aggregate([
                { $group: { _id: "$product_id", total: { $sum: "$trending_points" } } },
                { $limit: 5 }
            ]);
            console.log("Top Point Sums:", JSON.stringify(sum, null, 2));
        } else {
            console.log("DB IS EMPTY for trendingpoints!");
        }
        
        process.exit(0);
    } catch (err) {
        console.error("DB Check Error:", err);
        process.exit(1);
    }
}

checkPoints();
