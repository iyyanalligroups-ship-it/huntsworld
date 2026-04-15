
const TrendingPoints = require('../models/trendingPointsModel');
const TrendingPointsPayment = require('../models/userTrendingPointPaymentModel');
const mongoose=require('mongoose');
const Product=require('../models/productModel');
const { STATUS } = require('../constants/subscriptionConstants');


exports.createTrendingPoints = async (req, res) => {
  try {
    const { user_id, product_id, date, trending_points, subscription_id, trending_points_payment_id } = req.body;

    if (!user_id || !product_id || !date || !trending_points || !subscription_id || !trending_points_payment_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const payment = await TrendingPointsPayment.findOne({
      _id: trending_points_payment_id,
      user_id,
      subscription_id,
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP,
    });

    if (!payment) {
      return res.status(400).json({ message: 'Invalid or inactive trending points payment' });
    }

    if (trending_points > payment.points) {
      return res.status(400).json({ message: `Insufficient points. Available: ${payment.points}, Requested: ${trending_points}` });
    }

    const trendingPoints = new TrendingPoints({
      user_id,
      product_id,
      date,
      trending_points,
      subscription_id,
      trending_points_payment_id,
    });

    await trendingPoints.save();

    // Update remaining points
    await TrendingPointsPayment.findByIdAndUpdate(trending_points_payment_id, {
      points: payment.points - trending_points,
    });

    res.status(201).json({ trendingPoints });
  } catch (error) {
    console.error('Create Trending Points Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Trending points already assigned for this product on this date' });
    }
    res.status(500).json({ message: 'Failed to create trending points', error: error.message });
  }
};

exports.updateTrendingPoints = async (req, res) => {
  try {
    const { trending_points_id, user_id, product_id, date, trending_points, subscription_id, trending_points_payment_id } = req.body;

    if (!trending_points_id || !user_id || !product_id || !date || !trending_points || !subscription_id || !trending_points_payment_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingTrendingPoints = await TrendingPoints.findById(trending_points_id);
    if (!existingTrendingPoints) {
      return res.status(404).json({ message: 'Trending points not found' });
    }

    const payment = await TrendingPointsPayment.findOne({
      _id: trending_points_payment_id,
      user_id,
      subscription_id,
      payment_status: STATUS.PAID,
      status: STATUS.ACTIVE_CAP,
    });

    if (!payment) {
      return res.status(400).json({ message: 'Invalid or inactive trending points payment' });
    }

    const pointDifference = trending_points - existingTrendingPoints.trending_points;
    if (pointDifference > payment.points) {
      return res.status(400).json({ message: `Insufficient points. Available: ${payment.points}, Requested additional: ${pointDifference}` });
    }

    const updatedTrendingPoints = await TrendingPoints.findOneAndUpdate(
      { _id: trending_points_id, user_id },
      {
        product_id,
        date,
        trending_points,
        subscription_id,
        trending_points_payment_id,
        updated_at: Date.now(),
      },
      { new: true }
    );

    if (!updatedTrendingPoints) {
      return res.status(404).json({ message: 'Trending points not found' });
    }

    await TrendingPointsPayment.findByIdAndUpdate(trending_points_payment_id, {
      points: payment.points - pointDifference,
    });

    res.status(200).json({ trendingPoints: updatedTrendingPoints });
  } catch (error) {
    console.error('Update Trending Points Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Trending points already assigned for this product on this date' });
    }
    res.status(500).json({ message: 'Failed to update trending points', error: error.message });
  }
};

exports.deleteTrendingPoints = async (req, res) => {
  try {
    const { trending_points_id } = req.body;
    if (!trending_points_id) {
      return res.status(400).json({ message: 'Trending points ID is required' });
    }

    const trendingPoints = await TrendingPoints.findById(trending_points_id);
    if (!trendingPoints) {
      return res.status(404).json({ message: 'Trending points not found' });
    }

    const payment = await TrendingPointsPayment.findById(trendingPoints.trending_points_payment_id);
    if (payment && payment.status === STATUS.ACTIVE_CAP && payment.payment_status === STATUS.PAID) {
      await TrendingPointsPayment.findByIdAndUpdate(trendingPoints.trending_points_payment_id, {
        points: payment.points + trendingPoints.trending_points,
      });
    }

    await TrendingPoints.findByIdAndDelete(trending_points_id);

    res.status(200).json({ message: 'Trending points deleted successfully' });
  } catch (error) {
    console.error('Delete Trending Points Error:', error);
    res.status(500).json({ message: 'Failed to delete trending points', error: error.message });
  }
};

