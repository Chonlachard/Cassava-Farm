const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { console } = require('inspector');

// ฟังก์ชันคำนวณพื้นที่จากพิกัด
function calculateAreaRai(latlngs) {
    if (!latlngs || latlngs.length < 3) {
        throw new Error("ต้องมีพิกัดอย่างน้อย 3 จุดขึ้นไปเพื่อสร้างพื้นที่");
    }

    // ตรวจสอบและแก้ไขพิกัดให้พอลิกอนปิดสนิท
    const firstPoint = latlngs[0];
    const lastPoint = latlngs[latlngs.length - 1];

    if (firstPoint.lat !== lastPoint.lat || firstPoint.lng !== lastPoint.lng) {
        latlngs.push({ lat: firstPoint.lat, lng: firstPoint.lng });
    }

    try {
        const polygon = turf.polygon([latlngs.map(p => [p.lng, p.lat])]);
        const area = turf.area(polygon); // คำนวณพื้นที่เป็นตารางเมตร
        return area / 1600; // แปลงเป็นไร่ (1 ไร่ = 1600 ตร.ม.)
        
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการคำนวณพื้นที่:", error);
        return null;
    }
}


async function handlePlotUpload(req, res) {
    const { user_id, plot_name, latlngs, fileData } = req.body;

    let parsedLatlngs;
    if (typeof latlngs === 'string') {
        try {
            parsedLatlngs = JSON.parse(latlngs);
        } catch (err) {
            return res.status(400).json({ message: 'ข้อมูล latlngs ไม่สามารถวิเคราะห์ได้', error: err.message });
        }
    } else {
        parsedLatlngs = latlngs;
    }

    // ตรวจสอบว่าพิกัดมีมากกว่า 3 จุด (ต้องมีอย่างน้อย 3 จุดเพื่อสร้าง Polygon)
    if (!parsedLatlngs || parsedLatlngs.length < 3) {
        return res.status(400).json({ message: 'ต้องมีพิกัดอย่างน้อย 3 จุดขึ้นไป' });
    }

    try {
        // คำนวณพื้นที่ (เป็นไร่)
        const area_rai = calculateAreaRai(parsedLatlngs);

        let imagePath = null;
        if (fileData) {
            // แปลง Base64 เป็นไฟล์
            const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
            const filename = `plot-${uuidv4()}.png`; // ใช้ UUID เพื่อให้ชื่อไฟล์ไม่ซ้ำ
            const filepath = path.join('public', 'uploads', filename);
            fs.writeFileSync(filepath, base64Data, 'base64');
            imagePath = `/uploads/${filename}`;
        }

        db.beginTransaction((err) => {
            if (err) throw err;

            const plotQuery = 'INSERT INTO plots (user_id, plot_name, area_rai, image_path) VALUES (?, ?, ?, ?)';
            db.query(plotQuery, [user_id, plot_name, area_rai, imagePath], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        throw err;
                    });
                }

                const plot_id = result.insertId;
                const locationQuery = 'INSERT INTO plot_locations (plot_id, latitude, longitude) VALUES ?';
                const locationValues = parsedLatlngs.map(latlng => [plot_id, latlng.lat, latlng.lng]);

                db.query(locationQuery, [locationValues], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            throw err;
                        });
                    }
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                throw err;
                            });
                        }
                        res.status(201).json({ message: 'บันทึกข้อมูลสำเร็จ' });
                    });
                });
            });
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', error: err.message });
    }
}

module.exports = { handlePlotUpload };


