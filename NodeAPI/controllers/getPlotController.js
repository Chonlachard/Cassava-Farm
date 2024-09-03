const db = require('../config/db');
const path = require('path');

exports.getPlots = async (req, res) => {
    const userId = req.query.user_id;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    try {
        const query = 'SELECT plot_name, area_rai, image_path FROM plots WHERE user_id = ?';
        
        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Error executing query:', err.stack);
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแปลง' });
            }

            // เพิ่ม URL ของภาพในผลลัพธ์
            const baseUrl = 'http://localhost:3000'; // URL ของโฮสต์ที่ให้บริการไฟล์
            const resultsWithImageUrl = results.map(plot => ({
                ...plot,
                imageUrl: plot.image_path ? `${baseUrl}${plot.image_path}` : null
            }));

            // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
            res.json(resultsWithImageUrl);
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' });
    }
};
