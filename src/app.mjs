import dotenv from "dotenv";
dotenv.config();
import path from "path";
import express from "express";
import mongoose from "mongoose";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Test from "./model/test.mjs";
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

app.post("/api/v1/message", async (req, res) => {
  try {
    const postMessage = new Test({
      message: req.body.message,
    });

    await postMessage.save();
    const tests = await Test.find({});

    res.send({
      result: "ok",
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
  console.log(req.file);
  req.file.buffer;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: req.file.originalname,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3.send(command);

  const imageUrl = `https://${process.env.BUCKET_NAME}.s3-${process.env.BUCKET_REGION}.amazonaws.com/${req.file.originalname}`;
  res.json({ result: "ok", imageUrl });
});

app.listen(3000, (req, res) => {
  console.log("ポート3000で待機中...");
});
