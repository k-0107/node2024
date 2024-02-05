import path from "path";
import express from "express";
import mongoose from "mongoose";
import Test from "./model/test.mjs";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

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

console.log(__dirname);
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

    const savepostMessage = await postMessage.save();
    const tests = await Test.find({});

    res.send({
      result: "ok",
      data: tests.map((test) => ({ id: test._id, message: test.message })),
    });
    console.log(tests);
  } catch (e) {
    console.error(e);
    res.json({ result: "ng" });
  }
});

app.post("/file", upload.single("image"), (req, res) => {
  console.log(req.body, req.file);
  res.json({ retult: "ok" });
});

app.listen(3000, (req, res) => {
  console.log("ポート3000で待機中...");
});
