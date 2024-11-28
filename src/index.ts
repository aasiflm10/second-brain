import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

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
      res.status(409).json({ message: "Username already taken." });
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
      res
        .status(200)
        .json({ message: "congrats you are signed in", user: existingUser });
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

app.post("/api/v1/content", (req, res) => {});

app.get("/api/v1/content", (req, res) => {});

app.listen(PORT, () => {
  console.log(`Server running on PORT http://localhost:${PORT}`);
});
