const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // เชื่อมต่อกับฐานข้อมูล

// ฟังก์ชันสำหรับเข้าสู่ระบบ
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    // ตรวจสอบว่ามีผู้ใช้ที่มีอีเมลนี้อยู่หรือไม่
    db.query('SELECT * FROM Users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = results[0];

        // ตรวจสอบรหัสผ่าน
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Bcrypt compare error:', err);
                return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน' });
            }

            if (!isMatch) {
                return res.status(400).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
            }

            // สร้าง JWT token
            const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });

            // ส่งข้อมูล user_id และ token กลับไปยัง client
            res.json({
                token,
                user: {
                    user_id: user.user_id,
                    firstName: user.first_name,
                    lastName: user.last_name
                }
            });
        });
    });
};
