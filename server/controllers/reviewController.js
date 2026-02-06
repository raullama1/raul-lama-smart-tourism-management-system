// server/controllers/reviewController.js
import {
  canUserReview,
  hasReviewed,
  createReview,
  getReviewsForTour,
} from "../models/reviewModel.js";

export async function submitReview(req, res) {
  try {
    const userId = req.user.id;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const booking = await canUserReview(userId, bookingId);
    if (!booking) {
      return res.status(403).json({
        message: "You can review only after completing the tour.",
      });
    }

    const alreadyReviewed = await hasReviewed(bookingId);
    if (alreadyReviewed) {
      return res.status(400).json({ message: "Review already submitted." });
    }

    await createReview({
      bookingId,
      userId,
      tourId: booking.tour_id,
      agencyId: booking.agency_id,
      rating,
      comment,
    });

    res.json({ message: "Review submitted successfully." });
  } catch (err) {
    console.error("Submit review error:", err);
    res.status(500).json({ message: "Failed to submit review." });
  }
}

export async function listReviews(req, res) {
  try {
    const { tourId, agencyId } = req.query;

    if (!tourId || !agencyId) {
      return res.status(400).json({ message: "tourId and agencyId required." });
    }

    const reviews = await getReviewsForTour(tourId, agencyId);
    res.json({ data: reviews });
  } catch (err) {
    console.error("Fetch reviews error:", err);
    res.status(500).json({ message: "Failed to load reviews." });
  }
}
