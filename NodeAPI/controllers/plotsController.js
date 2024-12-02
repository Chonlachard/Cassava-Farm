const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// ฟังก์ชันคำนวณพื้นที่จากพิกัด
function calculateAreaRai(latlngs) {
    // ตรวจสอบและแก้ไขพิกัดให้พอลิกอนปิดสนิท
    if (latlngs.length > 1 && (
        latlngs[0].lat !== latlngs[latlngs.length - 1].lat ||
        latlngs[0].lng !== latlngs[latlngs.length - 1].lng
    )) {
        latlngs.push(latlngs[0]); // เพิ่มจุดเริ่มต้นไปที่จุดสิ้นสุด
    }
    
    const polygon = turf.polygon([latlngs.map(p => [p.lng, p.lat])]);
    const area = turf.area(polygon); // พื้นที่ในตารางเมตร
    return area / 1600; // แปลงเป็นไร่
}


// ฟังก์ชันจัดการการอัปโหลด plot
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

    // ตรวจสอบและเติมข้อมูลพิกัดให้ครบ 20 ค่า
    if (!parsedLatlngs || parsedLatlngs.length < 20) {
        while (parsedLatlngs.length < 20) {
            parsedLatlngs.push({ lat: null, lng: null }); // เติมค่าว่าง
        }
    } else if (parsedLatlngs.length > 20) {
        parsedLatlngs = parsedLatlngs.slice(0, 20); // ตัดเหลือ 20 ค่า
    }

    try {
        // คำนวณพื้นที่
        const area_rai = calculateAreaRai(parsedLatlngs);

        let imagePath = null;
        if (fileData) {
            // แปลง Base64 เป็นไฟล์
            const base64Data = fileData.replace(/^data:image\/png;base64,/, "");
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


