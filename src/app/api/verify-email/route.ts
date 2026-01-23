export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const API_KEY = process.env.EMAILABLE_API_KEY;

    if (!API_KEY) {
      return Response.json({ isValid: true, warning: "Missing API key" });
    }

    const cleanEmail = email.toLowerCase().trim();

    const apiResponse = await fetch(
      `https://api.emailable.com/v1/verify?email=${encodeURIComponent(cleanEmail)}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    const data = await apiResponse.json();

    return Response.json({
      isValid:
        data.state === "deliverable" ||
        data.reason === "accepted_email",
      raw: data,
    });
  } catch (err) {
    console.error("Email API error:", err);
    return Response.json({ isValid: true });
  }
}
