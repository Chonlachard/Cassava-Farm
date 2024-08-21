const db = require('../config/db');

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้
exports.user = (req, res) => {
    // คุณอาจจะใช้ `req.query.user_id` หรือ `req.user.user_id` ขึ้นอยู่กับวิธีการจัดการ JWT
    const userId = req.query.user_id || req.user.user_id;

    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    db.query('SELECT first_name, last_name FROM Users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
        }

        const user = results[0];
        res.json({ firstName: user.first_name, lastName: user.last_name });
    });
};
