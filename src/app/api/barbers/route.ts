import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Barber from "@/models/Barber";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salonId");

    if (!salonId) {
      return NextResponse.json({ error: "salonId is required" }, { status: 400 });
    }

    const barbers = await Barber.find({ salonId }).sort({ createdAt: 1 });
    return NextResponse.json(barbers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch barbers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.salonId) {
      return NextResponse.json({ error: "salonId is required" }, { status: 400 });
    }
    const barber = await Barber.create(body);
    return NextResponse.json(barber, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create barber" }, { status: 500 });
  }
}
