const db = require('../config/db');

// สร้าง Worker ใหม่
exports.createWorker = (req, res) => {
    const { user_id, worker_name, phone, skills } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!user_id || !worker_name) {
        return res.status(400).send('ต้องระบุ User ID และ Worker Name');
    }

    const sql = 'INSERT INTO Workers (user_id, worker_name, phone, skills) VALUES (?, ?, ?, ?)';
    db.query(sql, [user_id, worker_name, phone, skills], (err, result) => {
        if (err) {
            console.error('ข้อผิดพลาดในการเพิ่ม Worker:', err);
            return res.status(500).send('ข้อผิดพลาดในการเพิ่ม Worker');
        }
        res.status(201).send(`Worker ถูกเพิ่มด้วย ID: ${result.insertId}`);
    });
};

// รับข้อมูล Worker ทั้งหมด หรือค้นหาตาม user_id
exports.getAllWorkers = (req, res) => {
    const userId = req.query.user_id; // รับค่า user_id จาก query parameters

    // กำหนดคำสั่ง SQL และพารามิเตอร์
    let sql = 'SELECT * FROM Workers';
    const queryParams = [];

    if (userId) { // ตรวจสอบว่ามี userId หรือไม่
        sql += ' WHERE user_id = ?';
        queryParams.push(userId); // เพิ่ม userId เป็นพารามิเตอร์
    }

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error('ข้อผิดพลาดในการดึงข้อมูล Workers:', err);
            return res.status(500).send('ข้อผิดพลาดในการดึงข้อมูล Workers');
        }
        if (results.length === 0) {
            return res.status(404).send('ไม่พบข้อมูล');
        }
        res.status(200).json(results); // ส่งผลลัพธ์เป็น JSON
    });
};


// รับข้อมูล Worker โดยใช้ ID
exports.getWorkerById = (req, res) => {
    const { id } = req.params;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!id) {
        return res.status(400).send('ต้องระบุ Worker ID');
    }

    const sql = 'SELECT * FROM Workers WHERE worker_id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('ข้อผิดพลาดในการดึงข้อมูล Worker:', err);
            return res.status(500).send('ข้อผิดพลาดในการดึงข้อมูล Worker');
        }
        if (result.length === 0) {
            return res.status(404).send('ไม่พบ Worker');
        }
        res.status(200).json(result[0]);
    });
};

// อัปเดตข้อมูล Worker
exports.updateWorker = (req, res) => {
    const { worker_name, phone, skills } = req.body;
    const { id } = req.params;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!worker_name || !id) {
        return res.status(400).send('ต้องระบุ Worker Name และ Worker ID');
    }

    const sql = 'UPDATE Workers SET worker_name = ?, phone = ?, skills = ?, updated_at = NOW() WHERE worker_id = ?';
    db.query(sql, [worker_name, phone, skills, id], (err, result) => {
        if (err) {
            console.error('ข้อผิดพลาดในการอัปเดตข้อมูล Worker:', err);
            return res.status(500).send('ข้อผิดพลาดในการอัปเดตข้อมูล Worker');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('ไม่พบ Worker');
        }
        res.status(200).send('Worker ถูกอัปเดตสำเร็จ');
    });
};

// ลบข้อมูล Worker
exports.deleteWorker = (req, res) => {
    const { id } = req.params;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!id) {
        return res.status(400).send('ต้องระบุ Worker ID');
    }

    const sql = 'DELETE FROM Workers WHERE worker_id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('ข้อผิดพลาดในการลบข้อมูล Worker:', err);
            return res.status(500).send('ข้อผิดพลาดในการลบข้อมูล Worker');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('ไม่พบ Worker');
        }
        res.status(200).send('Worker ถูกลบสำเร็จ');
    });
};
