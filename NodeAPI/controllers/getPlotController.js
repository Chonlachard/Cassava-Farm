const db = require('../config/db');
const path = require('path');
const turf = require('@turf/turf');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

exports.getPlots = async (req, res) => {
    const userId = req.query.user_id;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    try {
        const query = `SELECT 
            plot_id,
            plot_name,
            FLOOR(area_rai) AS rai, 
            ROUND((area_rai - FLOOR(area_rai)) * 400) AS wa,
            CONCAT(FLOOR(area_rai), ' ไร่ ', ROUND((area_rai - FLOOR(area_rai)) * 400), ' ตารางวา') AS totalArea,
            image_path
        FROM plots
        WHERE user_id = ?
        AND is_delete = 0`;
        
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
    const plotId = Number(req.params.plot_id); // แปลง plot_id เป็นตัวเลข
    console.log('Received plot_id:', plotId);

    if (!plotId || isNaN(plotId)) {
        return res.status(400).json({ message: 'กรุณาส่ง plot_id ที่ถูกต้อง' });
    }

    const sqlQuery = `
        SELECT 
            a.plot_id,
            a.plot_name,
            FLOOR(a.area_rai) AS rai, 
            ROUND((a.area_rai - FLOOR(a.area_rai)) * 400) AS wa,
            CONCAT(FLOOR(a.area_rai), ' ไร่ ', ROUND((a.area_rai - FLOOR(a.area_rai)) * 400), ' ตารางวา') AS totalArea,
            a.image_path,
            COALESCE(GROUP_CONCAT(b.latitude ORDER BY b.location_id ASC SEPARATOR ','), '') AS latitudes,
            COALESCE(GROUP_CONCAT(b.longitude ORDER BY b.location_id ASC SEPARATOR ','), '') AS longitudes
        FROM 
            plots a 
        LEFT JOIN 
            plot_locations b 
        ON 
            a.plot_id = b.plot_id 
        WHERE 
            a.plot_id = ?
        GROUP BY 
            a.plot_id, a.plot_name, a.area_rai, a.image_path
        LIMIT 1;
    `;


    db.query(sqlQuery, [plotId], (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล', error });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลสำหรับ plot_id ที่ระบุ' });
        }

        // แปลงค่าละติจูดและลองจิจูดจาก GROUP_CONCAT เป็นอาร์เรย์
        const plotData = results[0];
        const latitudes = plotData.latitudes ? plotData.latitudes.split(',') : [];
        const longitudes = plotData.longitudes ? plotData.longitudes.split(',') : [];

        res.status(200).json({
            plot_id: plotData.plot_id,
            plot_name: plotData.plot_name,
            area_rai: plotData.rai, // ใช้ค่า "ไร่" ที่คำนวณแล้ว
            wa: plotData.wa, // ตารางวา
            total_area: plotData.totalArea, // ขนาดแปลงในหน่วย "ไร่ ตารางวา"
            image_path: plotData.image_path,
            latitudes,
            longitudes
        });
    });
};



exports.EditPlot = async (req, res) => {
    const { plot_id, user_id, plot_name, latlngs, fileData } = req.body;

    try {
        // ดึงข้อมูลเดิมของแปลง
        const [plotResult] = await db.promise().query('SELECT * FROM plots WHERE plot_id = ?', [plot_id]);
        if (plotResult.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลแปลงที่ต้องการแก้ไข' });
        }

        const existingPlot = plotResult[0];

        // ดึงตำแหน่งพิกัดเดิม
        const [locationResult] = await db.promise().query('SELECT latitude, longitude FROM plot_locations WHERE plot_id = ?', [plot_id]);
        const currentLatlngs = locationResult.map(loc => ({ lat: loc.latitude, lng: loc.longitude }));

        // ตรวจสอบว่าพิกัดมีการเปลี่ยนแปลงหรือไม่
        const parsedLatlngs = JSON.stringify(currentLatlngs) !== JSON.stringify(latlngs) ? latlngs : currentLatlngs;

        // ตรวจสอบว่ามีการอัปโหลดรูปภาพใหม่หรือไม่
        let imagePath = existingPlot.image_path;
        if (fileData) {
            if (!fileData.startsWith('data:image/png;base64,')) {
                return res.status(400).json({ message: 'รูปภาพไม่ถูกต้อง' });
            }

            const base64Data = fileData.replace(/^data:image\/png;base64,/, "");
            const filename = `plot-${uuidv4()}.png`;
            const filepath = path.join('public', 'uploads', filename);
            fs.writeFileSync(filepath, base64Data, 'base64');
            imagePath = `/uploads/${filename}`;
        }

        // คำนวณพื้นที่ใหม่
        const area_rai = calculateAreaRai(parsedLatlngs);

        // อัปเดตข้อมูลแปลง
        await db.promise().query(
            'UPDATE plots SET user_id = ?, plot_name = ?, area_rai = ?, image_path = ? WHERE plot_id = ?',
            [user_id, plot_name, area_rai, imagePath, plot_id]
        );

        // ลบตำแหน่งพิกัดเดิมและเพิ่มตำแหน่งใหม่
        await db.promise().query('DELETE FROM plot_locations WHERE plot_id = ?', [plot_id]);

        if (parsedLatlngs.length > 0) {
            const locationValues = parsedLatlngs.map(latlng => [plot_id, latlng.lat, latlng.lng]);
            await db.promise().query('INSERT INTO plot_locations (plot_id, latitude, longitude) VALUES ?', [locationValues]);
        }

        res.status(200).json({ message: 'อัปเดตข้อมูลสำเร็จ' });

    } catch (err) {
        console.error('❌ Error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', error: err.message });
    }
};
// ฟังก์ชันคำนวณพื้นที่จากพิกัด
function calculateAreaRai(latlngs) {
    if (!latlngs || latlngs.length < 3) {
        throw new Error("ต้องมีพิกัดอย่างน้อย 3 จุดขึ้นไปเพื่อสร้างพื้นที่");
    }

    // ตรวจสอบและปิด Polygon (เพิ่มจุดแรกเป็นจุดสุดท้าย)
    const firstPoint = latlngs[0];
    const lastPoint = latlngs[latlngs.length - 1];

    if (firstPoint.lat !== lastPoint.lat || firstPoint.lng !== lastPoint.lng) {
        latlngs.push({ lat: firstPoint.lat, lng: firstPoint.lng });
    }

    try {
        const polygon = turf.polygon([latlngs.map(p => [p.lng, p.lat])]);
        const areaInSquareMeters = turf.area(polygon); // คำนวณพื้นที่เป็นตารางเมตร

        // แปลง ตารางเมตร -> ไร่ (1 ไร่ = 1600 ตร.ม.)
        const areaInRai = areaInSquareMeters / 1600;

        return parseFloat(areaInRai.toFixed(4)); // ปัดเป็นทศนิยม 4 ตำแหน่งก่อนบันทึก
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการคำนวณพื้นที่:", error);
        return null;
    }
}
