import mongoose from "mongoose";
const Schema = mongoose.Schema;

const photoSchema = new Schema({
  filename: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
});

const Photo = mongoose.model("PHOTO", photoSchema);
export default Photo;
