
// Use global fetch

async function testFullRegistration() {
  const salonName = "Full Test Salon " + Date.now();
  const salonData = {
    name: salonName,
    location: "Test Location",
    contact: "1234567890",
    ownerId: "admin-demo"
  };

  try {
    console.log("Creating Salon...");
    const sRes = await fetch('http://localhost:3000/api/salons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salonData)
    });
    const salon = await sRes.json();
    console.log("Salon Created:", salon._id);

    console.log("Creating Barber...");
    const bRes = await fetch('http://localhost:3000/api/barbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Test Barber", salonId: salon._id, avatarColor: "#2563eb" })
    });
    console.log("Barber Response Status:", bRes.status);

    console.log("Creating Service...");
    const svRes = await fetch('http://localhost:3000/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Test Service", salonId: salon._id, durationMinutes: 30, price: 100 })
    });
    console.log("Service Response Status:", svRes.status);

  } catch (error) {
    console.error("Error:", error);
  }
}

testFullRegistration();
