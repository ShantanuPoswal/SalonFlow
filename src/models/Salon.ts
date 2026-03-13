import mongoose, { Schema, Document } from "mongoose";

export interface ISalon extends Document {
  name: string;
  slug: string; // URL-friendly name
  ownerId: string; // For authentication (Clerk/NextAuth ID)
  location?: string;
  contact?: string;
  logo?: string;
  businessHours?: {
    open: string;
    close: string;
  };
  rating?: number;
  isDemo?: boolean;
}

const SalonSchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  location: { type: String },
  contact: { type: String },
  logo: { type: String },
  businessHours: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "22:00" }
  },
  rating: { type: Number, default: 5 },
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Salon || mongoose.model<ISalon>("Salon", SalonSchema);
