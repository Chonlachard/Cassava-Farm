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
        cb(null, Date.now() + path.extname(file.originalname));
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
