const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db'); // หรือเส้นทางที่ถูกต้องตามโปรเจคของคุณ

// การตั้งค่า Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // ใช้ชื่อไฟล์ที่ถูกอัปโหลดพร้อมกับนามสกุล
        const originalName = file.originalname;
        cb(null, originalName); // กำหนดชื่อไฟล์เป็นชื่อที่อัปโหลด
    }
});
const upload = multer({ storage: storage });

// ฟังก์ชันสำหรับเพิ่มข้อมูลการเก็บเกี่ยว
exports.addHarvest = function (req, res) {
    // ใช้ multer middleware สำหรับการอัปโหลดไฟล์
    upload.single('image')(req, res, function (err) {
        if (err) {
            return res.status(400).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดภาพ: ' + err.message });
        }

        // รับข้อมูลจาก req.body
        const { user_id, plot_id, harvest_date, company_name, net_weight_kg, starch_percentage, amount } = req.body;
        const image_path = req.file ? `/uploads/${req.file.filename}` : null;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!user_id || !plot_id || !harvest_date || !company_name || !net_weight_kg || !starch_percentage || !amount) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลการเก็บเกี่ยว' });
        }

        // คำสั่ง SQL สำหรับการเพิ่มข้อมูล
        const query = 'INSERT INTO harvests (user_id, plot_id, harvest_date, company_name, net_weight_kg, starch_percentage, image_path, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

        // ทำการเพิ่มข้อมูลไปยังฐานข้อมูล
        db.query(query, [user_id, plot_id, harvest_date, company_name, net_weight_kg, starch_percentage, image_path, amount], (err, results) => {
            if (err) {
                console.error('ข้อผิดพลาดในการทำคำสั่ง SQL:', err);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการเก็บเกี่ยว' });
            }
            res.json({ message: 'เพิ่มข้อมูลการเก็บเกี่ยวสำเร็จ' });
        });
    });
};

exports.getHarvests = async (req, res) => {
    const userId = req.query.user_id;

    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    try {
        const query = `
            SELECT a.harvest_id, a.harvest_date,b.plot_name,a.company_name,a.net_weight_kg,a.starch_percentage,a.amount
            FROM harvests a
            LEFT JOIN plots b ON a.plot_id = b.plot_id
            WHERE a.user_id = ?
            ORDER BY a.harvest_date DESC`;

        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Error executing query:', err.stack);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการเก็บเกี่ยว' });
            }

            // ส่งผลลัพธ์ในรูปแบบ JSON
            res.json(results);
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' });
    }
};

exports.getSerch = (req, res) => {
    const userId = req.query.user_id;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    // คำสั่ง SQL สำหรับดึง plot_id และ plot_name โดยใช้ user_id
    const query = 'SELECT plot_id as value, plot_name as text FROM plots WHERE user_id = ?';

    // ทำการ query ฐานข้อมูล
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแปลง' });
        }

        // ส่งผลลัพธ์ในรูปแบบ JSON
        res.json(results);
    });
};

exports.deleteHarvest = async (req, res) => {
    const harvestId = req.params.harvest_id; // แก้เป็น 'harvest_id'

    if (!harvestId) {
        return res.status(400).json({ message: 'กรุณาระบุ harvest_id' });
    }

    const query = 'DELETE FROM harvests WHERE harvest_id = ?';
    try {
        db.query(query, [harvestId], (err, results) => {
            if (err) {
                console.error('Error executing query:', err.stack);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลการเก็บเกี่ยว' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ message: 'ไม่พบข้อมูลการเก็บเกี่ยว' });
            }

            res.json({ message: 'ลบข้อมูลการเก็บเกี่ยวสำเร็จ' });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลการเก็บเกี่ยว' });
    }
};

exports.updateHarvest = async (req, res) => {
    const { harvest_id, plot_id, harvest_date, company_name, net_weight_kg, starch_percentage, amount } = req.body;
    let image_path = null;

    // ตรวจสอบว่ามีไฟล์อัปโหลดใหม่หรือไม่
    if (req.file) {
        image_path = `/uploads/${req.file.filename}`; // ใช้ชื่อไฟล์ใหม่ที่อัปโหลด
    }

    // ตรวจสอบความครบถ้วนของข้อมูลที่จำเป็น
    if (!harvest_id || !plot_id || !harvest_date || !company_name || !net_weight_kg || !starch_percentage || !amount) {
        return res.status(400).json({ error: 'ข้อมูลบางอย่างขาดหายไป' });
    }

    try {
        const [results] = await db.promise().query(
            `UPDATE harvests
             SET plot_id = ?, harvest_date = ?, company_name = ?, net_weight_kg = ?, starch_percentage = ?, amount = ?${image_path ? ', image_path = ?' : ''}
             WHERE harvest_id = ?`,
            [
                plot_id, 
                harvest_date, 
                company_name, 
                net_weight_kg, 
                starch_percentage, 
                amount,
                ...(image_path ? [image_path] : []), // ถ้ามี image_path ให้เพิ่มไปในพารามิเตอร์
                harvest_id
            ]
        );

        // ตรวจสอบว่ามีแถวที่ได้รับการอัปเดตหรือไม่
        if (results.affectedRows > 0) {
            res.status(200).json({ message: 'ข้อมูลการเก็บเกี่ยวถูกอัปเดตเรียบร้อยแล้ว' });
        } else {
            res.status(404).json({ error: 'ไม่พบข้อมูลการเก็บเกี่ยวที่ต้องการอัปเดต' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการเก็บเกี่ยว', error });
    }
};





exports.getUpdateHarvest = async (req, res) => {
    const harvestId = req.params.harvest_id;

    // ตรวจสอบว่าได้ส่ง harvest_id หรือไม่
    if (!harvestId) {
        return res.status(400).json({ message: 'กรุณาระบุ harvest_id' });
    }

    const query = `
    SELECT a.harvest_id , a.harvest_date, b.plot_name, a.company_name, a.net_weight_kg, a.starch_percentage, a.amount , a.image_path
    FROM harvests a
    LEFT JOIN plots b ON a.plot_id = b.plot_id
    WHERE a.harvest_id = ?
    `;

    db.query(query, [harvestId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการเก็บเกี่ยว' });
        }
        // ตรวจสอบว่าพบข้อมูลหรือไม่
        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลค่าใช้จ่าย' });
        }
        return res.status(200).json(results[0]);
    })

};

exports.getHarvestImage = (req, res) => {
    const baseUrl = 'http://localhost:3000';  // กำหนด baseUrl
    const harvestId = req.params.harvest_id;

    if (!harvestId) {
        return res.status(400).json({ message: 'กรุณาระบุ harvest_id' });
    }

    const query = 'SELECT image_path FROM harvests WHERE harvest_id = ?';

    // ดึง path ของรูปภาพจากฐานข้อมูล
    db.query(query, [harvestId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรูปภาพ' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบรูปภาพสำหรับ harvest_id นี้' });
        }

        const imageUrl = `${baseUrl}${results[0].image_path}`;
        res.json({ imageUrl });
    });
};

