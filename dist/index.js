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
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.status(200).json({ message: "Server running fine" });
});
app.get('/api/v1/database-connection', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.$connect();
        res.status(200).json({ message: "Database is connected and active" });
    }
    catch (error) {
        console.log("Database connection error: ", error);
        res.status(500).json({ message: "Failed to connect to database : ", error: error });
    }
}));
app.post('/api/v1/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) {
        res.status(400).json({ message: "Username and password are required" });
        return;
    }
    try {
        const existingUser = yield prisma.user.findFirst({
            where: { username }
        });
        if (existingUser) {
            res.status(409).json({ message: "Username already taken." });
            return;
        }
        const newEntry = yield prisma.user.create({
            data: {
                username: username,
                password: password
            }
        });
        console.log("User created successfully ", newEntry);
        res.status(200).json({ message: "user created successfully", user: newEntry });
    }
    catch (error) {
        res.status(400).json({ message: "error creating a user", error: error });
    }
}));
app.post('/api/v1/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    try {
        const existingUser = yield prisma.user.findFirst({
            where: {
                username,
                password
            }
        });
        if (existingUser) {
            res.status(200).json({ message: "congrats you are signed in", user: existingUser });
            return;
        }
        else {
            res.status(400).json({ mesage: "user not found ", user: existingUser });
            return;
        }
    }
    catch (e) {
        res.status(400).json({ message: "error occured while logging in ", error: e });
    }
}));
app.post('/api/v1/content', (req, res) => {
});
app.get('/api/v1/content', (req, res) => {
});
app.listen(PORT, () => {
    console.log(`Server running on PORT http://localhost:${PORT}`);
});
