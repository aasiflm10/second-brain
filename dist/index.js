"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const SECRET_KEY = "Hey";
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.status(200).json({ message: "Server running fine" });
});
app.get("/api/v1/database-connection", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.$connect();
        res.status(200).json({ message: "Database is connected and active" });
    }
    catch (error) {
        console.log("Database connection error: ", error);
        res
            .status(500)
            .json({ message: "Failed to connect to database : ", error: error });
    }
}));
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) {
        res.status(400).json({ message: "Username and password are required" });
        return;
    }
    try {
        const existingUser = yield prisma.user.findFirst({
            where: { username },
        });
        if (existingUser) {
            res.status(409).json({ message: "Username already taken." });
            return;
        }
        const newEntry = yield prisma.user.create({
            data: {
                username: username,
                password: password,
            },
        });
        console.log("User created successfully ", newEntry);
        res
            .status(200)
            .json({ message: "user created successfully", user: newEntry });
    }
    catch (error) {
        res.status(400).json({ message: "error creating a user", error: error });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    try {
        const existingUser = yield prisma.user.findFirst({
            where: {
                username,
                password,
            },
            select: { id: true },
        });
        if (existingUser) {
            const token = jsonwebtoken_1.default.sign({ id: existingUser.id }, config_1.JWT_SECRET);
            res
                .status(200)
                .json({ message: "congrats you are signed in", user: existingUser, jwt: token });
            return;
        }
        else {
            res.status(400).json({ mesage: "user not found ", user: existingUser });
            return;
        }
    }
    catch (e) {
        res
            .status(400)
            .json({ message: "error occured while logging in ", error: e });
    }
}));
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { link, type, title, tags } = req.body;
    const userId = req.userId; // Extracted from the middleware
    if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
    }
    try {
        const tagsArray = tags.split(" ");
        // Create the Content entry and connect or create tags in one go
        const newContentEntry = yield prisma.content.create({
            data: {
                link,
                type,
                title,
                userId,
                tags: {
                    connectOrCreate: tagsArray.map((tagTitle) => ({
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
    }
    catch (error) {
        console.error("Error creating content:", error);
        res.status(500).json({ message: "Error creating content", error: error });
    }
}));
app.get("/api/v1/content/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        // Fetch all contents for the given userId
        const userContents = yield prisma.content.findMany({
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
    }
    catch (error) {
        console.error("Error fetching user contents:", error);
        res.status(500).json({
            message: "Error fetching contents",
            error: error,
        });
    }
}));
app.get("/api/v1/content", (req, res) => { });
app.listen(PORT, () => {
    console.log(`Server running on PORT http://localhost:${PORT}`);
});
