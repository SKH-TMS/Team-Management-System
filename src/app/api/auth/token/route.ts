import { NextResponse } from "next/server";
import { getToken, verifyToken, GetUserType, GetUserRole } from "@/utils/token";
import { connectToDatabase } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import User from "@/models/User";
import Team from "@/models/Team";
export async function POST(req: Request) {
  try {
    console.log("🔍 Token verification started...");

    await connectToDatabase();

    const token = getToken(req);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "No token provided",
        },
        { status: 401 }
      );
    }

    const decodedUser = verifyToken(token);

    if (!decodedUser || !decodedUser.email) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 403 }
      );
    }

    let requestBody: { userType?: string } = {};
    try {
      requestBody = await req.json();
    } catch (error) {
      console.warn("⚠️ No JSON body received.");
    }

    const requestedUserType = requestBody.userType || "User";

    let userType = "User";

    const TypeofUser = GetUserType(token);

    if (requestedUserType == TypeofUser) {
      if (requestedUserType === "Admin") {
        const admin = await Admin.findOne({ email: decodedUser.email });
        userType = "Admin";
        //

        if (!admin) {
          return NextResponse.json(
            {
              success: false,
              message: "admin not found",
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Token valid",
          admin: {
            email: admin.email,
            firstname: admin.firstname,
            lastname: admin.lastname,
            profilepic: admin.profilepic || "/default-profile.png",
            contact: admin.contact || "",
            userType, // Distinguish between User and Admin
          },
        });
        //
        //
      } else if (requestedUserType === "User") {
        const user = await User.findOne({ email: decodedUser.email });
        userType = "User";
        if (!user) {
          return NextResponse.json(
            {
              success: false,
              message: "User not found",
            },
            { status: 404 }
          );
        }

        // Get team roles from the token and standardize them as an array.
        const rolesFromToken = GetUserRole(token);
        let userRoles: string[] = [];
        if (rolesFromToken) {
          if (Array.isArray(rolesFromToken)) {
            userRoles = rolesFromToken;
          } else if (typeof rolesFromToken === "string") {
            userRoles = [rolesFromToken];
          }
        }
        if (userRoles.length > 0) {
          return NextResponse.json({
            success: true,
            message: "Token valid",
            user: {
              email: user.email,
              firstname: user.firstname,
              lastname: user.lastname,
              profilepic: user.profilepic || "/default-profile.png",
              contact: user.contact || "",
              userType,
              userRoles,
            },
          });
        }
        return NextResponse.json({
          success: true,
          message: "Token valid",
          user: {
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            profilepic: user.profilepic || "/default-profile.png",
            contact: user.contact || "",
            userType,
          },
        });

        //
      } else if (requestedUserType === "ProjectManager") {
        const ProjectManager = await User.findOne({ email: decodedUser.email });
        userType = "ProjectManager";
        if (!ProjectManager) {
          return NextResponse.json(
            {
              success: false,
              message: "User not found",
            },
            { status: 404 }
          );
        }

        //
        return NextResponse.json({
          success: true,
          message: "Token valid",
          ProjectManager: {
            email: ProjectManager.email,
            firstname: ProjectManager.firstname,
            lastname: ProjectManager.lastname,
            profilepic: ProjectManager.profilepic || "/default-profile.png",
            contact: ProjectManager.contact || "",
            userType,
          },
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        message: "User Type is wrong",
      });
    }
  } catch (error) {
    console.error("❌ Error verifying token:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error verifying token",
      },
      { status: 500 }
    );
  }
}
