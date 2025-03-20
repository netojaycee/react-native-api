import express from "express";
import Book from "../models/Book.js";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, image, rating } = req.body;
    if (!title || !caption || !image || !rating) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;

    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });

    await newBook.save();

    res.status(201).json(newBook);
  } catch (error) {
    console.log("Error creating book", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/", protectRoute, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;
    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalBooks = await Book.countDocuments();
    res.send({
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Failed to fetch all books", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/user", protectRoute, async (req, res) => {
  try {
    // const page = req.query.page || 1;
    // const limit = req.query.limit || 5;
    // const skip = (page - 1) * limit;
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    //   .skip(skip)
    //   .limit(limit);

    // const totalBooks = await Book.countDocuments();
    // res.send({
    //   books,
    //   currentPage: page,
    //   totalBooks,
    //   totalPages: Math.ceil(totalBooks / limit),
    // });
    res.json(books);
  } catch (error) {
    console.log("Failed to fetch all books", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.user.toString() !== req.user._id)
      return res.status(401).json({ message: "Unauthorized" });

    if (book.image && book.image.includes("cloudinary")) {
      try {
        const pubId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(pubId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }
    await book.deleteOne();
    res.status(200).json({ message: "book deleted succesfully" });
  } catch (error) {
    console.log("Error deleting book", error);
    res.status(500).json({ message: "Internal Server error" });
  }
});


export default router;
