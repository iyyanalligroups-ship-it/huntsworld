// const express = require("express");

// const app = express();
// const dotenv = require("dotenv");
// const redeemLetterRoute = require('./routes/redeemLetterRoute');
// const cors = require("cors");
// dotenv.config();
// const morgan = require("morgan");
// const bodyParser = require("body-parser");
// const path = require("path");

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// const studentRoute = require("./routes/studentRoute");

// const PORT = process.env.PORT || 8080;

// app.use(
//   "/uploads",
//   express.static(path.join(__dirname, "uploads"), {
//     setHeaders: (res, path) => {
//       res.setHeader("Cache-Control", "no-store");
//     },
//   })
// );

// //route paths

// const merchantRoutes = require("./routes/merchantRoute");
// const userRoute = require("./routes/userRoute");
// const serviceProviderRoute = require("./routes/serviceProviderRoute");
// const categoryRoute = require("./routes/categoryRoute");
// const subCategoryRoute = require("./routes/subCategoryRoute");
// const deepSubCategoryRoute = require("./routes/deepSubCategoryRoute");
// const productRoute = require("./routes/productRoute");
// const complaintRoute = require("./routes/complaintRoute");
// const chatMessageRoute = require("./routes/chatMessageRoute");
// const bannerImageRoute = require("./routes/bannerImageRoute");
// const trustSealRoute = require("./routes/trustSealRoute");
// const brandImageRoute = require("./routes/brandImageRoute");
// const reportFileRoute = require("./routes/reportFileRoute");
// // const imageRoutes = require('./routes/studentRoute');

// const grocerySellerRoutes = require("./routes/groceryRoutes"); // New route for Grocery Seller

// // Middlewares
// app.use(
//   "/uploads",
//   express.static(path.join(__dirname, "uploads"), {
//     setHeaders: (res, path) => {
//       res.setHeader("Cache-Control", "no-store");
//       res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL,process.env.FRONTEND_URL1); // ✅ Allow your frontend
//       res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS"); // Optional
//       res.setHeader(
//         "Access-Control-Allow-Headers",
//         "Origin, Content-Type, Accept"
//       );
//     },
//   })
// );

// // Middlewares
// app.use(
//   cors({
//     origin: [
//       process.env.FRONTEND_URL,
//       process.env.PRODUCTION_URL,
//       "http://localhost:5173",
//       "http://localhost:5174",
//       "https://demo.huntsworld.com",
//       "https://www.demo.huntsworld.com",
//       "https://huntsworld.com",
//       "https://www.huntsworld.com",
//       "https://www.admin.huntsworld.com",
//       "https://admin.huntsworld.com",
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// app.use((req, res, next) => {
//   const allowedOrigins = [
//     process.env.FRONTEND_URL,
//     process.env.PRODUCTION_URL,
//     "http://localhost:5173",
//     "http://localhost:5174",
//     "https://demo.huntsworld.com",
//     "https://www.demo.huntsworld.com",
//     "https://huntsworld.com",
//     "https://www.huntsworld.com",
//     "https://www.admin.huntsworld.com",
//     "https://admin.huntsworld.com",
//   ];
//   const origin = req.headers.origin;

//   if (allowedOrigins.includes(origin)) {
//     res.header("Access-Control-Allow-Origin", origin);
//   }

//   res.header(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, DELETE, PATCH, OPTIONS"
//   );
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   next();
// });
// app.use(morgan("dev")); // Log requests
// app.use(bodyParser.json()); // Parse JSON request bodies
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json());

// // Serve static files for uploads
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Route middlewares
// // app.use("/api/v1/upload", uploadRoutes);

// app.use("/api/v1/merchant-images", merchantRoutes);
// app.use("/api/v1/user-images", userRoute);
// app.use("/api/v1/service-provider-images", serviceProviderRoute);
// app.use("/api/v1/grocery-seller-images", grocerySellerRoutes);
// app.use("/api/v1/student-images", studentRoute);
// // app.use('/api/v1', imageRoutes);
// app.use("/api/v1/category-images", categoryRoute);
// app.use("/api/v1/subCategory-images", subCategoryRoute);
// app.use("/api/v1/deepSubCategory-images", deepSubCategoryRoute);
// app.use("/api/v1/product-images", productRoute);
// app.use("/api/v1/complaint-forms", complaintRoute);
// app.use("/api/v1/chat-message-images", chatMessageRoute);
// app.use("/api/v1/banner-image", bannerImageRoute);
// app.use("/api/v1/trust-seal-images", trustSealRoute);
// app.use('/api/v1/redeem-letter', redeemLetterRoute);
// app.use("/api/v1/brand-images", brandImageRoute);
// app.use("/api/v1/report-file", reportFileRoute);
// app.get("/", (req, res) => {
//   res.send("Hello from the server!");
// });

// // Start the server

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ======================
// CORS (MUST BE TOP)
// ======================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://huntsworld.com",
  "https://www.huntsworld.com",
  "https://demo.huntsworld.com",
  "https://www.demo.huntsworld.com",
  "https://admin.huntsworld.com",
  "https://www.admin.huntsworld.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// LOGGING (DEV ONLY)
// ======================
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ======================
// STATIC FILES (FAST PATH)
// ======================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    immutable: true,
  })
);

// ======================
// ROUTES (CENTRALIZED)
// ======================
require("./routes/index")(app);

// ======================
app.get("/", (req, res) => {
  res.send("🖼️ Image server running");
});

// ======================
app.listen(PORT, () => {
  console.log(`🟢 Image server running on port ${PORT}`);
});
