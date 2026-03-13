import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  name: string;
  durationMinutes: number;
  price: number;
  salonId: mongoose.Types.ObjectId;
}

const ServiceSchema: Schema = new Schema({
  name: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  price: { type: Number, required: true },
  salonId: { type: Schema.Types.ObjectId, ref: "Salon", required: true }
}, { timestamps: true });

export default mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);
