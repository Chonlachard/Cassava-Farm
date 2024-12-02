const db = require('../config/db');
const path = require('path');

exports.getPlots = async (req, res) => {
    const userId = req.query.user_id;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    try {
        const query = 'SELECT * FROM plots WHERE user_id = ?';
        
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

exports.deletePlot = async (req, res) => {
    const plotId = req.params.plot_id;

    // ตรวจสอบว่ามี plotId หรือไม่
    if (!plotId) {
        return res.status(400).json({ message: 'กรุณาระบุ plot_id' });
    }

    try {
        // เริ่มต้นการทำธุรกรรม
        await new Promise((resolve, reject) => {
            db.beginTransaction(err => {
                if (err) return reject(err);
                resolve();
            });
        });

        // ลบข้อมูลจาก plot_locations โดยใช้ plot_id
        await new Promise((resolve, reject) => {
            db.query('DELETE FROM plot_locations WHERE plot_id = ?', [plotId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        // ลบข้อมูลจาก plots โดยใช้ plot_id
        const result = await new Promise((resolve, reject) => {
            db.query('DELETE FROM plots WHERE plot_id = ?', [plotId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        // ตรวจสอบว่ามีแถวที่ถูกลบหรือไม่
        if (result.affectedRows === 0) {
            // ถ้าไม่พบข้อมูลที่จะลบ ให้ย้อนกลับธุรกรรมและส่งข้อผิดพลาด
            await new Promise((resolve, reject) => {
                db.rollback(() => reject(new Error('ไม่พบข้อมูลที่ต้องการลบ')));
            });
        } else {
            // คอมมิทธุรกรรม
            await new Promise((resolve, reject) => {
                db.commit(err => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            // ส่งข้อความยืนยันการลบข้อมูล
            res.status(200).json({ message: 'ลบข้อมูลและข้อมูลที่เกี่ยวข้องเรียบร้อยแล้ว' });
        }
    } catch (error) {
        // ถ้ามีข้อผิดพลาด ให้ย้อนกลับธุรกรรมและส่งข้อผิดพลาด
        await new Promise((resolve, reject) => {
            db.rollback(() => reject(error));
        });
        res.status(500).json({ message: error.message });
    }
};

exports.getPlotsUpdate = (req, res) => {
    const { plot_id } = req.params; // ใช้ req.params แทน req.body

    if (!plot_id) {
        return res.status(400).json({ message: 'กรุณาส่ง plot_id มาด้วย' });
    }

    const sqlQuery = `
        SELECT 
            a.plot_id,
            a.plot_name,
            CAST(a.area_rai AS SIGNED) AS area_rai,
            a.image_path,
            GROUP_CONCAT(b.latitude ORDER BY b.location_id ASC) AS latitudes,
            GROUP_CONCAT(b.longitude ORDER BY b.location_id ASC) AS longitudes
        FROM 
            plots a 
        LEFT JOIN 
            plot_locations b 
        ON 
            a.plot_id = b.plot_id 
        WHERE 
            a.plot_id = ?
        GROUP BY 
            a.plot_id
        LIMIT 1;  -- จำกัดผลลัพธ์ให้แสดงแค่แถวเดียว
    `;

    db.query(sqlQuery, [plot_id], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล', error });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลสำหรับ plot_id ที่ระบุ' });
        }

        // แปลงค่าละติ ลองจิ ที่เก็บใน GROUP_CONCAT เป็นอาร์เรย์
        const plotData = results[0];
        const latitudes = plotData.latitudes ? plotData.latitudes.split(',') : [];
        const longitudes = plotData.longitudes ? plotData.longitudes.split(',') : [];

        res.status(200).json({
            plot_id: plotData.plot_id,
            plot_name: plotData.plot_name,
            area_rai: plotData.area_rai,
            image_path: plotData.image_path,
            latitudes,
            longitudes
        });
    });
};

