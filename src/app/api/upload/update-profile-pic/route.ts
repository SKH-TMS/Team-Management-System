import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const formData = await req.formData();
    const file = formData.get("profilePic") as File | null;
    const emailRaw = formData.get("email");
    const email =
      typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : null;

    if (!file || !email) {
      return NextResponse.json(
        { success: false, message: "File and email are required." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Invalid File Type" },
        { status: 400 }
      );
    }
    const MAX_BYTES = 3 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, message: "File size should not exceed 3 MB." },
        { status: 400 }
      );
    }

    const userBefore = await User.findOne({ email });
    if (!userBefore) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    if (userBefore.profilePicFileId) {
      try {
        await imagekit.deleteFile(userBefore.profilePicFileId);
      } catch (e) {
        console.warn("⚠️ could not delete old ImageKit file:", e);
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const ext = file.name.split(".").pop() || "jpg";
    const safeName = `user-${email.replace(/[@.]/g, "_")}.${ext}`;

    const uploadRes = await imagekit.upload({
      file: base64,
      fileName: safeName,
      folder: "/userPics",
      useUniqueFileName: true,
    });

    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        profilepic: uploadRes.url,
        profilePicFileId: uploadRes.fileId,
      },
      { new: true }
    );
    if (!updatedUser) {
      throw new Error("Failed to update user record");
    }

    return NextResponse.json({
      success: true,
      profilePicUrl: uploadRes.url,
    });
  } catch (err) {
    console.error("❌ Error in user pic upload:", err);
    return NextResponse.json(
      { success: false, message: "Profile picture update failed" },
      { status: 500 }
    );
  }
}
