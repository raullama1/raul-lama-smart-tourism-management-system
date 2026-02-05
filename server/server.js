// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import publicToursRoutes from "./routes/publicToursRoutes.js";
import publicHomeRoutes from "./routes/publicHomeRoutes.js";
import publicBlogsRoutes from "./routes/publicBlogsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// Root check
app.get("/", (req, res) => {
  res.json({ message: "Smart Tourism API running..." });
});

// Home (popular tours + latest blogs)
app.use("/api/public/home", publicHomeRoutes);

// Tours list + details
app.use("/api/public/tours", publicToursRoutes);

// Blogs list
app.use("/api/public/blogs", publicBlogsRoutes);

// Auth routes
app.use("/api/auth", authRoutes);

// Wishlist routes
app.use("/api/wishlist", wishlistRoutes);

// Booking routes
import bookingRoutes from "./routes/bookingRoutes.js";
app.use("/api/bookings", bookingRoutes);

// Payment routes
app.use("/api/payments", paymentRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
