const express = require('express');
const router = express.Router();
const User = require("../models/user");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');

router.post("/signup", async (req, res) => {
    try {
        console.log(req.body);
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);



        const newUser = await User.create({
            username: name.trim(),
            email: normalizedEmail,
            passwordHash: passwordHash,
        });



        const Accesstoken = jwt.sign({ id: newUser._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15d' });
        const Refreshtoken = jwt.sign({ id: newUser._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '15d' });

        const hashRefreshToken = await bcrypt.hash(Refreshtoken, 10);

        newUser.refreshTokenHash = hashRefreshToken;
        await newUser.save();

        res.cookie('AccessToken', Accesstoken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 24 * 60 * 60 * 1000,

        });
        res.cookie('RefreshToken', Refreshtoken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 24 * 60 * 60 * 1000,

        });


        return res.status(201).json({
            success: true,
            message: "User created successfully",
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email);
        console.log(password);
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the credentials",
            })
        }
        const normalizedEmail = email.toLowerCase().trim();
        const exist = await User.findOne({ email: normalizedEmail });        // console.log(exist);
        if (!exist) {
            return res.status(404).json({
                success: false,
                message: "User not found please Signup"
            })
        }

        const ismatch = await bcrypt.compare(password, exist.passwordHash);
        if (!ismatch) {
            return res.status(400).json({
                success: false,
                message: "password or email doesnt match"
            })
        }

        const Accesstoken = jwt.sign({ id: exist._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15d' });
        const Refreshtoken = jwt.sign({ id: exist._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '15d' });

        const hashRefreshToken = await bcrypt.hash(Refreshtoken, 10);


        exist.refreshTokenHash = hashRefreshToken;
        await exist.save();

        res.cookie('AccessToken', Accesstoken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 24 * 60 * 60 * 1000,

        });
        res.cookie('RefreshToken', Refreshtoken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 24 * 60 * 60 * 1000,

        });

        return res.json({
            success: true,
            message: "login successfull",
        });
    } catch (error) {
        console.log('Internal Server Error' + error);
        return res.status(500).json({ message: "Server error" });
    }
});

router.post('/logout', async (req, res) => {
    try {
        console.log("logout hit....");
        console.log("cookies are .....", req.cookies.AccessToken);
        const refreshToken = req.cookies.RefreshToken;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id);

        if (!user || !user.refreshTokenHash) {
            return res.status(403).json({ success: false, message: "Invalid token" });
        }

        const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

        if (!isValid) {
            return res.status(403).json({ success: false, message: "Token mismatch" });
        }

        user.refreshTokenHash = null;
        await user.save();

        res.clearCookie('AccessToken');
        res.clearCookie('RefreshToken');

        return res.json({ success: true, message: "Logout successful" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Logout failed" });
    }
});

router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.RefreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }
    let decode;
    try {
        decode = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        console.log(error);
        res.clearCookie('AccessToken');
        res.clearCookie('RefreshToken');
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }

    const user = await User.findById(decode.id);

    if (!user || !user.refreshTokenHash) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        })
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!valid) {
        user.refreshTokenHash = null;
        await user.save();
        res.clearCookie('AccessToken');
        res.clearCookie('RefreshToken');
        return res.status(403).json({
            success: false,
            message: "Token reuse detected"
        });
    }

    const Accesstoken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const Refreshtoken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '15d' });

    const hashRefreshToken = await bcrypt.hash(Refreshtoken, 10);

    user.refreshTokenHash = hashRefreshToken;
    await user.save();

    res.cookie('AccessToken', Accesstoken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,

    });
    res.cookie('RefreshToken', Refreshtoken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 15 * 24 * 60 * 60 * 1000,

    });

    return res.json({
        success: true,
        message: "token refreshed successfully",
    });
});

router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user).select("-passwordHash -refreshTokenHash");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;