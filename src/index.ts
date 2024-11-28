import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JWT_SECRET } from "./config";
import { userMiddleware } from "./middleware";

const app = express();
const prisma = new PrismaClient();
const SECRET_KEY = "Hey"
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server running fine" });
});
app.get("/api/v1/database-connection", async (req, res) => {
  try {
    await prisma.$connect();
    res.status(200).json({ message: "Database is connected and active" });
  } catch (error) {
    console.log("Database connection error: ", error);
    res
      .status(500)
      .json({ message: "Failed to connect to database : ", error: error });
  }
});
app.post("/api/v1/signup", async (req, res) => {
  const username = req.body.username;

  const password = req.body.password;

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }
  try {
    const existingUser = await prisma.user.findFirst({
      where: { username },
    });

    if (existingUser) {
      res.status(409).json({ message: "Username already taken."});
      return;
    }

    const newEntry = await prisma.user.create({
      data: {
        username: username,
        password: password,
      },
    });
    console.log("User created successfully ", newEntry);
    res
      .status(200)
      .json({ message: "user created successfully", user: newEntry });
  } catch (error) {
    res.status(400).json({ message: "error creating a user", error: error });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        password,
      },
      select: { id: true },
    });

    if (existingUser) {

      const token = jwt.sign({ id: existingUser.id }, JWT_SECRET);

      res
        .status(200)
        .json({ message: "congrats you are signed in", user: existingUser , jwt : token});
      return;
    } else {
      res.status(400).json({ mesage: "user not found ", user: existingUser });
      return;
    }
  } catch (e) {
    res
      .status(400)
      .json({ message: "error occured while logging in ", error: e });
  }
});

app.post("/api/v1/content", userMiddleware, async (req: Request, res: Response) => {
  const { link, type, title, tags } = req.body;
  const userId = req.userId; // Extracted from the middleware

  if (!userId) {
    res.status(400).json({ message: "User ID is required" });
    return;
}

  try {
      const tagsArray = tags.split(" ");

      // Create the Content entry and connect or create tags in one go
      const newContentEntry = await prisma.content.create({
          data: {
              link,
              type,
              title,
              userId,
              tags: {
                  connectOrCreate: tagsArray.map((tagTitle : any) => ({
                      where: { title: tagTitle },
                      create: { title: tagTitle },
                  })),
              },
          },
      });

      res.status(200).json({
          message: "Content created successfully",
          content: newContentEntry,
      });
  } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Error creating content", error: error });
  }
});

app.get("/api/v1/content/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
      // Fetch all contents for the given userId
      const userContents = await prisma.content.findMany({
          where: { userId },
          include: {
              tags: true, // Include associated tags
          },
      });

      // Check if contents exist for the user
      if (userContents.length === 0) {
          res.status(404).json({
              message: "No contents found for the given user",
          });
          return;
      }

      res.status(200).json({
          message: "Contents retrieved successfully",
          contents: userContents,
      });
  } catch (error) {
      console.error("Error fetching user contents:", error);
      res.status(500).json({
          message: "Error fetching contents",
          error: error,
      });
  }
});

app.get("/api/v1/content", (req, res) => {});

app.listen(PORT, () => {
  console.log(`Server running on PORT http://localhost:${PORT}`);
});
