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
exports.addHarvest = async function (req, res) {
    try {
        // ✅ ใช้ Promise รอให้ `multer` อัปโหลดไฟล์เสร็จก่อน
        await new Promise((resolve, reject) => {
            upload.single('image')(req, res, function (err) {
                if (err) return reject(err);
                resolve();
            });
        });

        const { user_id, plot_id, harvest_date, company_name, net_weight_kg, starch_percentage, price, amount } = req.body;
        const image_path = req.file ? `/uploads/${req.file.filename}` : null;

        if (!user_id || !plot_id || !harvest_date || !company_name || !net_weight_kg || !starch_percentage || !price || !amount) {
            return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' });
        }

        console.log("🚀 Received Data:", req.body);

        // ❌ ลบการตรวจสอบข้อมูลซ้ำออกไป

        const insertQuery = `
            INSERT INTO harvests (
                user_id, plot_id, harvest_date, company_name, net_weight_kg, 
                starch_percentage, price, amount, image_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [results] = await db.promise().query(insertQuery, [
            user_id, plot_id, harvest_date, company_name, net_weight_kg,
            starch_percentage, price, amount, image_path
        ]);

        console.log("✅ Data Inserted:", results);
        res.json({ message: 'เพิ่มข้อมูลการเก็บเกี่ยวสำเร็จ' });

    } catch (err) {
        console.error('❌ Error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลการเก็บเกี่ยว' });
    }
};



exports.getHarvests = async (req, res) => {
    const { user_id, plot_id, company_name, harvest_date_start, harvest_date_end, net_weight_min, net_weight_max, starch_percentage_min, starch_percentage_max, price_min, price_max } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    let query = `
        SELECT a.harvest_id, a.harvest_date, b.plot_name, a.company_name, a.net_weight_kg, a.starch_percentage, a.price, a.amount, a.image_path
        FROM harvests a
        LEFT JOIN plots b ON a.plot_id = b.plot_id
        WHERE a.user_id = ?
        AND a.is_delete = 0
    `;
    const params = [user_id];

    if (plot_id) {
        query += ' AND a.plot_id = ?';
        params.push(plot_id);
    }
    if (company_name) {
        query += ' AND a.company_name LIKE ?';
        params.push(`%${company_name}%`);
    }
    if (harvest_date_start && harvest_date_end) {
        query += ' AND a.harvest_date BETWEEN ? AND ?';
        params.push(harvest_date_start, harvest_date_end);
    }
    if (net_weight_min && net_weight_max) {
        query += ' AND a.net_weight_kg BETWEEN ? AND ?';
        params.push(net_weight_min, net_weight_max);
    }
    if (starch_percentage_min && starch_percentage_max) {
        query += ' AND a.starch_percentage BETWEEN ? AND ?';
        params.push(starch_percentage_min, starch_percentage_max);
    }
    if (price_min && price_max) {
        query += ' AND a.price BETWEEN ? AND ?';
        params.push(price_min, price_max);
    }

    query += ' ORDER BY a.harvest_date DESC';

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการเก็บเกี่ยว' });
        }

        res.json(results);
    });
};


exports.getSerch = (req, res) => {
    const userId = req.query.user_id;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    // คำสั่ง SQL สำหรับดึง plot_id และ plot_name โดยใช้ user_id
    const query = 'SELECT plot_id as value, plot_name as text FROM plots WHERE user_id = ? AND is_delete = 0';

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

    const query = 'UPDATE harvests SET is_delete = 1 WHERE harvest_id = ?';
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
    const {
        harvest_id,
        plot_id,
        harvest_date,
        company_name,
        net_weight_kg,
        starch_percentage,
        price,
        amount
    } = req.body;
    let image_path = null;

    try {
        // ดึงข้อมูลไฟล์เก่าจากฐานข้อมูล
        const [oldData] = await db.promise().query('SELECT image_path FROM harvests WHERE harvest_id = ?', [harvest_id]);

        // ตรวจสอบว่ามีไฟล์อัปโหลดใหม่หรือไม่
        if (req.file) {
            // ลบไฟล์เก่าถ้ามี
            if (oldData.length > 0 && oldData[0].image_path) {
                const oldFilePath = path.join(__dirname, '..', 'public', oldData[0].image_path);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath); // ลบไฟล์เก่า
                }
            }
            image_path = `/uploads/${req.file.filename}`; // ใช้ชื่อไฟล์ใหม่ที่อัปโหลด
        } else {
            // ใช้ไฟล์เดิมถ้าไม่มีการอัปโหลดไฟล์ใหม่
            if (oldData.length > 0) {
                image_path = oldData[0].image_path; // เก็บไฟล์ภาพเก่า
            }
        }

        // ตรวจสอบความครบถ้วนของข้อมูลที่จำเป็น
        if (
            !harvest_id ||
            !plot_id ||
            !harvest_date ||
            !company_name ||
            !net_weight_kg ||
            !starch_percentage ||
            !price ||
            !amount
        ) {
            return res.status(400).json({ error: 'ข้อมูลบางอย่างขาดหายไป' });
        }

        const sql = `
            UPDATE harvests
            SET 
                plot_id = ?, 
                harvest_date = ?, 
                company_name = ?, 
                net_weight_kg = ?, 
                starch_percentage = ?, 
                price = ?, 
                amount = ?, 
                image_path = ?
            WHERE harvest_id = ?
        `;

        const params = [
            plot_id,
            harvest_date,
            company_name,
            net_weight_kg,
            starch_percentage,
            price,
            amount,
            image_path,
            harvest_id
        ];

        const [results] = await db.promise().query(sql, params);

        if (results.affectedRows > 0) {
            res.status(200).json({ message: 'ข้อมูลการเก็บเกี่ยวถูกอัปเดตเรียบร้อยแล้ว' });
        } else {
            res.status(404).json({ error: 'ไม่พบข้อมูลการเก็บเกี่ยวที่ต้องการอัปเดต' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการเก็บเกี่ยว', error: error.message });
    }
};







exports.getUpdateHarvest = async (req, res) => {
    const harvestId = req.params.harvest_id;
    console.log(harvestId)

    // ตรวจสอบว่าได้ส่ง harvest_id หรือไม่
    if (!harvestId) {
        return res.status(400).json({ message: 'กรุณาระบุ harvest_id' });
    }

    const query = `
    SELECT a.harvest_id ,a.plot_id , a.harvest_date, a.company_name, a.net_weight_kg, a.starch_percentage,a.price, a.amount , a.image_path
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

