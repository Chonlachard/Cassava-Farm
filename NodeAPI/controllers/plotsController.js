const turf = require('@turf/turf');
const db = require('../config/db'); // ตรวจสอบว่าพาธถูกต้อง

// ฟังก์ชันคำนวณพื้นที่จากพิกัด
function calculateAreaRai(latlngs) {
    const polygon = turf.polygon([latlngs.map(p => [p.lng, p.lat])]);
    const area = turf.area(polygon); // พื้นที่ในตารางเมตร
    return area / 1600; // แปลงเป็นไร่
}

// ฟังก์ชันจัดการการอัปโหลด plot
async function handlePlotUpload(req, res) {
    const { user_id, plot_name, latlngs } = req.body;
    const image = req.file;

    if (!latlngs || latlngs.length < 3) {
        return res.status(400).json({ message: 'กรุณาระบุตำแหน่งพิกัดที่เพียงพอสำหรับการคำนวณพื้นที่' });
    }

    try {
        // คำนวณพื้นที่
        const area_rai = calculateAreaRai(JSON.parse(latlngs)); 

        let imagePath = null;
        if (image) {
            imagePath = `/uploads/${image.filename}`;
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
                const locationValues = JSON.parse(latlngs).map(latlng => [plot_id, latlng.lat, latlng.lng]);

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
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', error: err.message });
    }
}

module.exports = { handlePlotUpload };
