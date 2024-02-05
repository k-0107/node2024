import mongoose from "mongoose";
const Schema = mongoose.Schema;

const testSchema = new Schema({
  message: String,
});

const Test = mongoose.model("TEST", testSchema);
export default Test;
