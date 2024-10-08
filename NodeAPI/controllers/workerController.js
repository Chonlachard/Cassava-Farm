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

exports.deleteWorker = async (req, res) => {
    const workerId = req.params.worker_id;

    if (!workerId) {
        return res.status(400).json({ message: 'กรุณาระบุ worker_id' });
    }

    const query = 'DELETE FROM workers WHERE worker_id = ?';
    try {
        const result = await new Promise((resolve, reject) => {
            db.query(query, [workerId], (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        if (result.affectedRows === 0) {
            // ไม่มีข้อมูลที่ตรงกับ expense_id
            return res.status(404).json({ message: 'ไม่พบข้อมูลคนงานที่ต้องการลบ' });
        }

        res.json({ message: 'ลบข้อมูลคนงานสำเร็จ' });
    } catch (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลคนงาน' });
    }
};

exports.getUpdateWorker = async (req, res) => {
    const workerId = req.params.worker_id;

    // ตรวจสอบว่ามีการส่ง worker_id มาหรือไม่
    if (!workerId) {
        return res.status(400).json({ message: 'กรุณาระบุ worker_id' });
    }

    // คำสั่ง SQL สำหรับดึงข้อมูลพนักงานตาม worker_id
    const query = 'SELECT * FROM workers WHERE worker_id = ?';

    // เรียกใช้คำสั่ง SQL
    try {
        db.query(query, [workerId], (err, results) => {
            if (err) {
                console.error('Database query error:', err.stack);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน' });
            }

            // ตรวจสอบว่ามีผลลัพธ์หรือไม่
            if (results.length === 0) {
                return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงาน' });
            }

            // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
            res.json(results[0]); // ใช้ results[0] เนื่องจากต้องการส่งข้อมูลพนักงานคนเดียว
        });
    } catch (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน' });
    }
};
