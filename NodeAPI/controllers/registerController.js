const bcrypt = require('bcrypt');
const db = require('../config/db');

// ลงทะเบียน
exports.register = async (req, res) => {
    const { first_name, last_name, phone, email, password } = req.body;

    // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วนหรือไม่
    if (!first_name || !last_name || !phone || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // ตรวจสอบว่ามีผู้ใช้ที่มีอีเมลนี้แล้วหรือไม่
        const [existingUser] = await db.promise().query('SELECT * FROM Users WHERE email = ?', [email]);
        
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // เพิ่มผู้ใช้ใหม่ในฐานข้อมูล
        const [result] = await db.promise().query(
            'INSERT INTO Users (first_name, last_name, phone, email, password) VALUES (?, ?, ?, ?, ?)', 
            [first_name, last_name, phone, email, hashedPassword]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
