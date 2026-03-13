import mongoose, { Schema, Document } from "mongoose";

export interface IBarber extends Document {
  name: string;
  status: "available" | "busy" | "away";
  currentService?: string;
  currentCustomer?: string;
  startTime?: Date;
  salonId: mongoose.Types.ObjectId;
  avatarColor?: string;
}

const BarberSchema: Schema = new Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ["available", "busy", "away"], default: "available" },
  currentService: { type: String },
  currentCustomer: { type: String },
  startTime: { type: Date },
  salonId: { type: Schema.Types.ObjectId, ref: "Salon", required: true },
  avatarColor: { type: String, default: "#3b82f6" }
}, { timestamps: true });

export default mongoose.models.Barber || mongoose.model<IBarber>("Barber", BarberSchema);
