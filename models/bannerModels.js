import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  bannerImage: {
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: false,
  },
  offer: {
    type: String,
    required: false,
  }
}, {
  timestamps: true
});

const bannerModel = mongoose.model('Banner', bannerSchema);
export default bannerModel;
