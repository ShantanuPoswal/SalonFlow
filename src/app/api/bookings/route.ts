import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Booking from "@/models/Booking";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salonId");

    if (!salonId) {
      return NextResponse.json({ error: "salonId is required" }, { status: 400 });
    }

    const bookings = await Booking.find({
      salonId,
      status: { $in: ["pending", "in-progress"] }
    }).sort({ scheduledTime: 1 });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { barberId, serviceDuration, scheduledTime, salonId } = body;

    if (!salonId || !scheduledTime) {
      return NextResponse.json({ error: "salonId and scheduledTime are required" }, { status: 400 });
    }

    const startMs = new Date(scheduledTime).getTime();
    const endMs = startMs + (serviceDuration * 60 * 1000);
    const startDate = new Date(startMs);
    const endDate = new Date(endMs);

    // Concurrency / Collision Check
    const overlapping = await Booking.findOne({
      barberId,
      salonId,
      status: { $in: ["pending", "in-progress"] },
      $and: [
        { scheduledTime: { $lt: endDate } },
        { scheduledEndTime: { $gt: startDate } },
      ],
    });

    if (overlapping) {
      return NextResponse.json({ error: "Time slot already booked by another customer." }, { status: 409 });
    }

    // Determine queue position logic for the specific day
    const pendingBefore = await Booking.countDocuments({
      barberId,
      salonId,
      status: { $in: ["pending", "in-progress"] },
      scheduledTime: { $lt: startDate },
    });

    const booking = await Booking.create({
      ...body,
      scheduledTime: startDate,
      scheduledEndTime: endDate,
      queuePosition: pendingBefore + 1,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
