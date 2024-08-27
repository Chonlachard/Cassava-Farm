const moment = require('moment'); 
const db = require('../config/db'); // ใช้ db สำหรับเชื่อมต่อฐานข้อมูล

// ฟังก์ชันสำหรับดึงข้อมูลค่าใช้จ่าย
exports.getExpense = async (req, res) => {
    const userId = req.query.user_id;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    const query = 'SELECT * FROM expenses WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย' });
        }

        // แปลงวันที่จาก yyyy-mm-dd เป็น dd-mm-yyyy
        const formattedResults = results.map(expense => ({
            ...expense,
            expense_date: moment(expense.expense_date).format('DD-MM-YYYY')
        }));

        // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
        res.json(formattedResults);
    });
};

// ฟังก์ชันสำหรับเพิ่มข้อมูลค่าใช้จ่าย
exports.addExpense = async (req, res) => {
    const { user_id, expense_date, category, amount, details } = req.body;

    // ตรวจสอบว่ามีการส่งข้อมูลครบถ้วนหรือไม่
    if (!user_id || !expense_date || !category || !amount || !details) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const query = 'INSERT INTO expenses (user_id, expense_date, category, amount, details) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [user_id, expense_date, category, amount, details], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลค่าใช้จ่าย' });
        }

        res.json({ message: 'เพิ่มข้อมูลค่าใช้จ่ายสำเร็จ' });
    });
};
