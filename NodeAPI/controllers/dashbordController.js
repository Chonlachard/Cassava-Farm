const db = require('../config/db');


exports.getPlotAnalytics = async (req, res) => {
    const userId = req.params.user_id || req.body.user_id || req.query.user_id;

    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    const query = `
        SELECT 
            COUNT(DISTINCT p.plot_id) AS totalPlots,
            CAST(SUM(p.area_rai) AS SIGNED) AS totalArea,
            SUM(h.net_weight_kg) AS totalProduction
        FROM plots p
        LEFT JOIN harvests h ON p.plot_id = h.plot_id
        WHERE p.user_id = ?;
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
        }

        if (results.length === 0 || !results[0].totalPlots) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลแปลงสำหรับผู้ใช้ที่ระบุ' });
        }

        res.json(results[0]);  // ส่งคืนเฉพาะผลลัพธ์ที่สำคัญ เช่น totalPlots, totalArea, totalProduction
    });
};
