const db = require('../config/db');


exports.getWorker = async (req, res) => {

    // ดึง user_id จาก request parameters, body หรือ query
    const userId = req.params.user_id || req.body.user_id || req.query.user_id;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    const query = 'SELECT * FROM workers WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย' });
        }
       // ตรวจสอบว่ามีผลลัพธ์หรือไม่
       if (results.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงาน' });
    }

    // ส่งผลลัพธ์กลับไปในรูปแบบ JSON โดยตรง
    res.json(results);
    });
};

exports.addWorker = async (req, res) => {
    const { user_id, worker_name, phone, skills } = req.body;

    // ตรวจสอบว่าข้อมูลที่จำเป็นครบถ้วนหรือไม่
    if (!user_id || !worker_name || !phone || !skills) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const query = 'INSERT INTO workers (user_id, worker_name, phone, skills) VALUES (?, ?, ?, ?)';
    try {
        await new Promise((resolve, reject) => {
            db.query(query, [user_id, worker_name, phone, skills], (err, results) => {
                if (err) {
                    console.error('Database query error:', err); // เพิ่มการพิมพ์ข้อผิดพลาดที่เกิดขึ้น
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
        res.json({ message: 'เพิ่มข้อมูลคนงานสำเร็จ' });
    } catch (err) {
        console.error('Error executing query:', err.stack); // เพิ่มการพิมพ์ข้อผิดพลาดที่เกิดขึ้น
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลติดต่อคนงาน' });
    }
};


