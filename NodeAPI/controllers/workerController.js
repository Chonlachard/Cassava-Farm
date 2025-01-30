const db = require('../config/db');


exports.getWorker = async (req, res) => {
    const { user_id, keyword, skills } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    let query = 'SELECT * FROM workers WHERE user_id = ? AND is_delete = 0;';
    const params = [user_id];

    // ค้นหาชื่อหรือเบอร์โทร
    if (keyword) {
        query += ' AND (worker_name LIKE ? OR phone LIKE ?)';
        const keywordParam = `%${keyword}%`;  // ใช้ % สำหรับการค้นหาพาร์เชียล
        params.push(keywordParam, keywordParam);  // ส่งพารามิเตอร์สองตัวสำหรับ worker_name และ phone
    }

    // ค้นหาทักษะ
    if (skills) {
        query += ' AND skills LIKE ?'; // ใช้ LIKE เพื่อค้นหาทักษะ
        params.push(`%${skills}%`);  
    }

    // เรียงลำดับจาก worker_id ใหม่สุด
    query += ' ORDER BY worker_id DESC';

    // คิวรี่ฐานข้อมูล
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database query error:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคนงาน' });
        }



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


exports.editWorker = async (req, res) => {

    const { worker_id, user_id, worker_name, phone, skills } = req.body;

    try {
        // ตรวจสอบว่ามี worker_id หรือไม่
        if (!worker_id) {
            return res.status(400).json({ message: 'worker_id ต้องระบุ' });
        }

        // ดึงข้อมูลพนักงานจากฐานข้อมูล
        const [rows] = await db.promise().query('SELECT * FROM workers WHERE worker_id = ?', [worker_id]);

        // หากไม่พบข้อมูลพนักงาน
        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงาน' });
        }

        // คำสั่ง SQL สำหรับการอัปเดตข้อมูลพนักงาน
        const query = 'UPDATE workers SET user_id = ?, worker_name = ?, phone = ?, skills = ? WHERE worker_id = ?';

        // เรียกใช้งานคำสั่ง SQL และส่งค่าต่าง ๆ
        await db.promise().query(query, [user_id, worker_name, phone, JSON.stringify(skills), worker_id]);

        // ส่งผลลัพธ์กลับไปยัง client
        res.json({ message: 'อัปเดตข้อมูลพนักงานสำเร็จ' });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
};

