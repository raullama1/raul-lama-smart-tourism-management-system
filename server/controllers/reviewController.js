// server/controllers/reviewController.js
import {
  canUserReview,
  hasReviewed,
  createReview,
  getReviewsForTour,
  getReviewById,
  updateReviewById,
  deleteReviewById,
} from "../models/reviewModel.js";

export async function submitReview(req, res) {
  try {
    const userId = req.user?.id;
    const { bookingId, rating, comment } = req.body || {};

    const numericRating = Number(rating);
    const cleanComment = String(comment || "").trim();

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required." });
    }

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    if (cleanComment.length < 5) {
      return res
        .status(400)
        .json({ message: "Comment must be at least 5 characters long." });
    }

    const booking = await canUserReview(userId, bookingId);

    if (!booking) {
      return res.status(403).json({
        message: "You can review only after completing the paid tour.",
      });
    }

    const alreadyReviewed = await hasReviewed(bookingId);

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You already submitted a review for this booking.",
      });
    }

    await createReview({
      bookingId,
      userId,
      tourId: booking.tour_id,
      agencyId: booking.agency_id,
      rating: numericRating,
      comment: cleanComment,
    });

    return res.json({ message: "Review submitted successfully." });
  } catch (err) {
    console.error("Submit review error:", err);
    return res.status(500).json({ message: "Failed to submit review." });
  }
}

export async function listReviews(req, res) {
  try {
    const { tourId, agencyId } = req.query;
    const userId = req.user?.id || null;

    if (!tourId || !agencyId) {
      return res.status(400).json({ message: "tourId and agencyId required." });
    }

    const reviews = await getReviewsForTour(tourId, agencyId, userId);

    return res.json({ data: reviews });
  } catch (err) {
    console.error("Fetch reviews error:", err);
    return res.status(500).json({ message: "Failed to load reviews." });
  }
}

export async function updateReviewController(req, res) {
  try {
    const userId = req.user?.id;
    const reviewId = Number(req.params.reviewId);
    const { rating, comment } = req.body || {};

    const numericRating = Number(rating);
    const cleanComment = String(comment || "").trim();

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({ message: "Invalid review ID." });
    }

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    if (cleanComment.length < 5) {
      return res
        .status(400)
        .json({ message: "Comment must be at least 5 characters long." });
    }

    const review = await getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (Number(review.user_id) !== Number(userId)) {
      return res.status(403).json({ message: "You can edit only your own review." });
    }

    await updateReviewById(reviewId, {
      rating: numericRating,
      comment: cleanComment,
    });

    return res.json({ message: "Review updated successfully." });
  } catch (err) {
    console.error("Update review error:", err);
    return res.status(500).json({ message: "Failed to update review." });
  }
}

export async function deleteReviewController(req, res) {
  try {
    const userId = req.user?.id;
    const reviewId = Number(req.params.reviewId);

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({ message: "Invalid review ID." });
    }

    const review = await getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (Number(review.user_id) !== Number(userId)) {
      return res.status(403).json({ message: "You can delete only your own review." });
    }

    await deleteReviewById(reviewId);

    return res.json({ message: "Review deleted successfully." });
  } catch (err) {
    console.error("Delete review error:", err);
    return res.status(500).json({ message: "Failed to delete review." });
  }
}
