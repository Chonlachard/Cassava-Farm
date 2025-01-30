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
        const query = 'SELECT * FROM plots WHERE user_id = ? AND is_delete = 0;';
        
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


exports.EditPlot = (req, res) => {
    const { plot_id, user_id, plot_name, latlngs, fileData } = req.body;

    let parsedLatlngs;
    let imagePath = null;

    try {
        // ดึงข้อมูลแปลงเดิมจากฐานข้อมูล
        db.query('SELECT * FROM plots WHERE plot_id = ?', [plot_id], (err, plotResult) => {
            if (err) {
                return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแปลง', error: err.message });
            }

            if (plotResult.length === 0) {
                return res.status(404).json({ message: 'ไม่พบข้อมูลแปลงที่ต้องการแก้ไข' });
            }

            // ใช้ข้อมูลเดิมในกรณีที่ไม่มีการเปลี่ยนแปลง
            const existingPlot = plotResult[0];
            let currentLatlngs = [];

            // ดึงพิกัดตำแหน่งเดิม
            db.query('SELECT latitude, longitude FROM plot_locations WHERE plot_id = ?', [plot_id], (err, locationResult) => {
                if (err) {
                    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่ง', error: err.message });
                }

                currentLatlngs = locationResult.map(loc => ({ lat: loc.latitude, lng: loc.longitude }));

                // ตรวจสอบว่า latlngs มีการเปลี่ยนแปลงหรือไม่
                if (JSON.stringify(currentLatlngs) !== JSON.stringify(latlngs)) {
                    parsedLatlngs = latlngs;

                    // ตรวจสอบและเติมข้อมูลพิกัดให้ครบ 20 ค่า
                    if (!parsedLatlngs || parsedLatlngs.length < 20) {
                        while (parsedLatlngs.length < 20) {
                            parsedLatlngs.push({ lat: null, lng: null }); // เติมค่าว่าง
                        }
                    } else if (parsedLatlngs.length > 20) {
                        parsedLatlngs = parsedLatlngs.slice(0, 20); // ตัดเหลือ 20 ค่า
                    }
                } else {
                    // ถ้า latlngs ไม่มีการเปลี่ยนแปลง ใช้ค่าเดิม
                    parsedLatlngs = currentLatlngs;
                }

                // ตรวจสอบว่า imagePath มีการเปลี่ยนแปลงหรือไม่
                if (fileData) {
                    // ตรวจสอบว่า fileData เป็น Base64 หรือไม่
                    if (!fileData.startsWith('data:image/png;base64,')) {
                        return res.status(400).json({ message: 'รูปภาพไม่ถูกต้อง' });
                    }

                    const base64Data = fileData.replace(/^data:image\/png;base64,/, "");
                    const filename = `plot-${uuidv4()}.png`; // ใช้ UUID เพื่อให้ชื่อไฟล์ไม่ซ้ำ
                    const filepath = path.join('public', 'uploads', filename);
                    fs.writeFileSync(filepath, base64Data, 'base64');
                    imagePath = `/uploads/${filename}`;
                } else {
                    // ถ้าไม่มีการเปลี่ยนแปลง imagePath ใช้ค่าจากข้อมูลเดิม
                    imagePath = existingPlot.image_path;
                }

                // คำนวณพื้นที่
                const area_rai = calculateAreaRai(parsedLatlngs);

                // เริ่มต้นการทำธุรกรรมเพื่ออัปเดตข้อมูลแปลง
                db.beginTransaction((err) => {
                    if (err) throw err;

                    const plotQuery = 'UPDATE plots SET user_id = ?, plot_name = ?, area_rai = ?, image_path = ? WHERE plot_id = ?';
                    db.query(plotQuery, [user_id, plot_name, area_rai, imagePath, plot_id], (err, result) => {
                        if (err) {
                            return db.rollback(() => {
                                throw err;
                            });
                        }

                        // ลบข้อมูลตำแหน่งเดิมก่อนที่จะเพิ่มข้อมูลใหม่
                        const deleteLocationsQuery = 'DELETE FROM plot_locations WHERE plot_id = ?';
                        db.query(deleteLocationsQuery, [plot_id], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    throw err;
                                });
                            }

                            const locationQuery = 'INSERT INTO plot_locations (plot_id, latitude, longitude) VALUES ?';
                            const locationValues = parsedLatlngs.map(latlng => [plot_id, latlng.lat, latlng.lng]);

                            db.query(locationQuery, [locationValues], (err, result) => {
                                if (err) {
                                    return db.rollback(() => {
                                        throw err;
                                    });
                                }

                                // Commit การทำธุรกรรมหลังจากการอัปเดตข้อมูลสำเร็จ
                                db.commit((err) => {
                                    if (err) {
                                        return db.rollback(() => {
                                            throw err;
                                        });
                                    }
                                    res.status(200).json({ message: 'อัปเดตข้อมูลสำเร็จ' });
                                });
                            });
                        });
                    });
                });
            });
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', error: err.message });
    }
};
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
