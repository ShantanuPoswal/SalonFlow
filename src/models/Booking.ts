import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  customerName: string;
  customerPhone?: string;
  barberId: mongoose.Types.ObjectId;
  barberName: string;
  serviceName: string;
  serviceDuration: number;
  status: "pending" | "in-progress" | "completed" | "cancelled" | "no-show";
  type: "online" | "walkin";
  scheduledTime: Date;
  scheduledEndTime: Date;
  startTime?: Date;
  endTime?: Date;
  salonId: mongoose.Types.ObjectId;
  queuePosition?: number;
}

const BookingSchema: Schema = new Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  barberId: { type: Schema.Types.ObjectId, ref: "Barber", required: true },
  barberName: { type: String, required: true },
  serviceName: { type: String, required: true },
  serviceDuration: { type: Number, required: true },
  status: { type: String, enum: ["pending", "in-progress", "completed", "cancelled", "no-show"], default: "pending" },
  type: { type: String, enum: ["online", "walkin"], default: "walkin" },
  scheduledTime: { type: Date, required: true },
  scheduledEndTime: { type: Date, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  salonId: { type: Schema.Types.ObjectId, ref: "Salon", required: true },
  queuePosition: { type: Number }
}, { timestamps: true });

export default mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
