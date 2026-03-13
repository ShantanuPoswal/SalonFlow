import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Salon from "@/models/Salon";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, ownerId, location, contact, logo } = body;

    if (!name || !ownerId) {
      return NextResponse.json({ error: "Name and ownerId are required" }, { status: 400 });
    }

    // Create a slug from the name
    const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    // Check if slug already exists
    const existing = await Salon.findOne({ slug });
    let finalSlug = slug;
    if (existing) {
      finalSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const salon = await Salon.create({
      name,
      slug: finalSlug,
      ownerId,
      location,
      contact,
      logo
    });

    return NextResponse.json(salon, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to register salon" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");

    if (ownerId) {
      const salons = await Salon.find({ ownerId });
      return NextResponse.json(salons);
    }

    const salons = await Salon.find({});
    return NextResponse.json(salons);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch salons" }, { status: 500 });
  }
}
