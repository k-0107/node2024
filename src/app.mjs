import dotenv from "dotenv";
dotenv.config();
import path from "path";
import express from "express";
import mongoose from "mongoose";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import Test from "./model/test.mjs";
import Photo from "./model/photo.mjs";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
const __dirname = path.resolve();

mongoose
  .connect("mongodb://localhost:27017/TEST")
  .then(() => {
    console.log("MongoDBコネクションOK!");
  })
  .catch((err) => {
    console.log("MongoDBコネクションエラー!");
    console.log(err);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/test", express.static(path.join(__dirname, "../react2024/dist")));

app.get("/api/v1/", (req, res) => {
  res.json({
    result: "ok",
    api_level: 1,
    version: { "photo-project": "0.0.1" },
  });
});

app.post("/api/v1/Testmessage", async (req, res) => {
  try {
    res.send(req.body);
  } catch (e) {
    console.error(e);
    res.json({ result: "ng" });
  }
});

app.post("/api/v1/message", async (req, res) => {
  try {
    const postMessage = new Test({
      message: req.body.message,
    });

    await postMessage.save();
    const tests = await Test.find({});

    res.send({
      result: "send successfully",
      data: tests.map((test) => ({ id: test._id, message: test.message })),
    });
  } catch (e) {
    console.error(e);
    res.json({ result: "ng" });
  }
});

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

app.post("/file", upload.single("image"), async (req, res) => {
  const { originalname, buffer, mimetype, size } = req.file;

  const newPhoto = new Photo({
    filename: originalname,
    size: size,
  });
  console.log(newPhoto);
  await newPhoto.save();

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: newPhoto._id.toString(),
    Body: buffer,
    ContentType: mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3.send(command);

  res.send(newPhoto);
});

app.get("/photos", async (req, res) => {
  const photos = await Photo.find({});
  const photoUrls = photos.map((photo) => ({
    _id: photo._id,
    imageUrl: `https://${process.env.BUCKET_NAME}.s3-${process.env.BUCKET_REGION}.amazonaws.com/${photo._id}`,
  }));
  res.json({ photos: photoUrls });
});

app.delete("/photo/:id", async (req, res) => {
  try {
    const photoId = req.params.id;

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.json({ error: "Photo not found" });
    }

    console.log(photo);

    const deleteParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: photo._id.toString(),
    };
    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3.send(deleteCommand);

    await Photo.findByIdAndDelete(photoId);

    res.json({ results: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.json({ results: "ng" });
  }
});

app.listen(3000, (req, res) => {
  console.log("ポート3000で待機中...");
});
