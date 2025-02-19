const db = require('../config/db');



exports.getExpensesDetail = async (req, res) => {
    try {
        const userId = req.query.user_id;
        const category = req.query.category;
        const year = req.query.year;
        const startMonth = req.query.startMonth;
        const endMonth = req.query.endMonth;
        console.log(userId, category, year, startMonth, endMonth);

        if (!userId || !category || !year || !startMonth || !endMonth) {
            return res.status(400).json({ message: 'กรุณาระบุ user_id, category, year, startMonth และ endMonth' });
        }

        const expenseQueries = {
            'ค่าฮอร์โมน': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('ยี่ห้อ: ', COALESCE(h.brand, 'ไม่ระบุ')), 
                        CONCAT('ปริมาตร: ', COALESCE(h.volume, '0'), ' ml'),
                        CONCAT('ราคาต่อขวด: ', COALESCE(h.price_per_bottle, '0'), ' บาท'),
                        CONCAT('จำนวน: ', COALESCE(h.quantity, '0'), ' ขวด'),
                        CONCAT('ราคารวม: ', COALESCE(h.total_price, '0'), ' บาท'),
                        CONCAT('สถานที่ซื้อ: ', COALESCE(h.purchase_location, 'ไม่ระบุ'))
                    ) AS description
                FROM expenses e
                LEFT JOIN HormoneData h ON e.expense_id = h.expense_id
                WHERE e.user_id = ? AND e.category = ?
                AND YEAR(e.expenses_date) = ? 
                AND MONTH(e.expenses_date) BETWEEN ? AND ?
                ORDER BY e.expenses_date DESC`,
        
            'ค่าปุ๋ย': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('ยี่ห้อ: ', COALESCE(f.brand, 'ไม่ระบุ')), 
                        CONCAT('สูตร: ', COALESCE(f.formula, 'ไม่ระบุ')), 
                        CONCAT('ราคาต่อกระสอบ: ', COALESCE(f.price_per_bag, '0'), ' บาท'),
                        CONCAT('จำนวน: ', COALESCE(f.quantity, '0'), ' กระสอบ'),
                        CONCAT('ราคารวม: ', COALESCE(f.total_price, '0'), ' บาท'),
                        CONCAT('สถานที่ซื้อ: ', COALESCE(f.purchase_location, 'ไม่ระบุ'))
                    ) AS description
                FROM expenses e
                LEFT JOIN FertilizerData f ON e.expense_id = f.expense_id
                WHERE e.user_id = ? AND e.category = ?
                AND YEAR(e.expenses_date) = ? 
                AND MONTH(e.expenses_date) BETWEEN ? AND ?
                ORDER BY e.expenses_date DESC`,
        
            'ค่ายาฆ่าหญ้า': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('ยี่ห้อ: ', COALESCE(he.brand, 'ไม่ระบุ')), 
                        CONCAT('ปริมาตร: ', COALESCE(he.volume, '0'), ' ml'),
                        CONCAT('ราคาต่อขวด: ', COALESCE(he.price_per_bottle, '0'), ' บาท'),
                        CONCAT('จำนวน: ', COALESCE(he.quantity, '0'), ' ขวด'),
                        CONCAT('ราคารวม: ', COALESCE(he.total_price, '0'), ' บาท'),
                        CONCAT('สถานที่ซื้อ: ', COALESCE(he.purchase_location, 'ไม่ระบุ'))
                    ) AS description
                FROM expenses e
                LEFT JOIN HerbicideData he ON e.expense_id = he.expense_id
                WHERE e.user_id = ? AND e.category = ?
                AND YEAR(e.expenses_date) = ? 
                AND MONTH(e.expenses_date) BETWEEN ? AND ?
                ORDER BY e.expenses_date DESC`,
        
            'ค่าน้ำมัน': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('ราคาต่อลิตร: ', COALESCE(fu.price_per_liter, '0'), ' บาท'),
                        CONCAT('จำนวนลิตร: ', COALESCE(fu.quantity_liters, '0'), ' ลิตร'),
                        CONCAT('ราคารวม: ', COALESCE(fu.total_price, '0'), ' บาท')
                    ) AS description
                FROM expenses e
                LEFT JOIN FuelData fu ON e.expense_id = fu.expense_id
                WHERE e.user_id = ? AND e.category = ?
                AND YEAR(e.expenses_date) = ? 
                AND MONTH(e.expenses_date) BETWEEN ? AND ?
                ORDER BY e.expenses_date DESC`,
        
            'ค่าซ่อมอุปกรณ์': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('อุปกรณ์ที่ซ่อม: ', COALESCE(er.repair_names, 'ไม่ระบุ')), 
                        CONCAT('รายละเอียด: ', COALESCE(er.details, 'ไม่ระบุ')),
                        CONCAT('ค่าซ่อม: ', COALESCE(er.repair_cost, '0'), ' บาท'),
                        CONCAT('ร้านซ่อม: ', COALESCE(er.shop_name, 'ไม่ระบุ'))
                    ) AS description
                FROM expenses e
                LEFT JOIN EquipmentRepairData er ON e.expense_id = er.expense_id
                WHERE e.user_id = ? AND e.category = ?
                AND YEAR(e.expenses_date) = ? 
                AND MONTH(e.expenses_date) BETWEEN ? AND ?
                ORDER BY e.expenses_date DESC`,
        
            'ค่าเช่าที่ดิน': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('เจ้าของที่ดิน: ', COALESCE(l.owner_name, 'ไม่ระบุ')), 
                        CONCAT('เบอร์โทร: ', COALESCE(l.owner_phone, 'ไม่ระบุ')),
                        CONCAT('พื้นที่เช่า: ', COALESCE(l.area, '0'), ' ไร่'),
                        CONCAT('ราคาต่อไร่: ', COALESCE(l.price_per_rai, '0'), ' บาท'),
                        CONCAT('ราคารวม: ', COALESCE(l.total_price, '0'), ' บาท')
                    ) AS description
                FROM expenses e
                LEFT JOIN LandRentalData l ON e.expense_id = l.expense_id
                WHERE e.user_id = ? AND e.category = ?
                AND YEAR(e.expenses_date) = ? 
                AND MONTH(e.expenses_date) BETWEEN ? AND ?
                ORDER BY e.expenses_date DESC` ,
            'ค่าขุด': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('น้ำหนัก: ', COALESCE(ex.weight, '0'), ' กก.'), 
                CONCAT('ราคาต่อตัน: ', COALESCE(ex.price_per_ton, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(ex.total_price, '0'), ' บาท')
            ) AS description
        FROM expenses e
        LEFT JOIN ExcavationData ex ON e.expense_id = ex.expense_id
        WHERE e.user_id = ? AND e.category = ?
        AND YEAR(e.expenses_date) = ? 
        AND MONTH(e.expenses_date) BETWEEN ? AND ?
        ORDER BY e.expenses_date DESC`,

    'ค่าคนฉีดยาฮอโมน': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('จำนวนแกลลอน: ', COALESCE(hs.number_of_cans, '0'), ' แกลลอน'), 
                CONCAT('ราคาต่อแกลลอน: ', COALESCE(hs.price_per_can, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(hs.total_price, '0'), ' บาท')
            ) AS description
        FROM expenses e
        LEFT JOIN HormoneSpraying hs ON e.expense_id = hs.expense_id
        WHERE e.user_id = ? AND e.category = ?
        AND YEAR(e.expenses_date) = ? 
        AND MONTH(e.expenses_date) BETWEEN ? AND ?
        ORDER BY e.expenses_date DESC`,

    'ค่าอุปกรณ์': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('อุปกรณ์: ', COALESCE(ep.item_name, 'ไม่ระบุ')), 
                CONCAT('ร้านค้า: ', COALESCE(ep.shop_name, 'ไม่ระบุ')), 
                CONCAT('ราคา: ', COALESCE(ep.purchase_price, '0'), ' บาท'),
                CONCAT('รายละเอียด: ', COALESCE(ep.descript, 'ไม่ระบุ'))
            ) AS description
        FROM expenses e
        LEFT JOIN EquipmentPurchaseData ep ON e.expense_id = ep.expense_id
        WHERE e.user_id = ? AND e.category = ?
        AND YEAR(e.expenses_date) = ? 
        AND MONTH(e.expenses_date) BETWEEN ? AND ?
        ORDER BY e.expenses_date DESC`,

    'ค่าพันธุ์มัน': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('พันธุ์มัน: ', COALESCE(cv.variety_name, 'ไม่ระบุ')), 
                CONCAT('จำนวน: ', COALESCE(cv.quantity, '0'), ' ต้น'), 
                CONCAT('ราคาต่อต้น: ', COALESCE(cv.price_per_tree, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(cv.total_price, '0'), ' บาท'),
                CONCAT('สถานที่ซื้อ: ', COALESCE(cv.purchase_location, 'ไม่ระบุ'))
            ) AS description
        FROM expenses e
        LEFT JOIN CassavaVarietyData cv ON e.expense_id = cv.expense_id
        WHERE e.user_id = ? AND e.category = ?
        AND YEAR(e.expenses_date) = ? 
        AND MONTH(e.expenses_date) BETWEEN ? AND ?
        ORDER BY e.expenses_date DESC`,

    'ค่าคนตัดต้น': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('จำนวนต้น: ', COALESCE(tc.number_of_trees, '0'), ' ต้น'), 
                CONCAT('ราคาต่อต้น: ', COALESCE(tc.price_per_tree, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(tc.total_price, '0'), ' บาท')
            ) AS description
        FROM expenses e
        LEFT JOIN TreeCutting tc ON e.expense_id = tc.expense_id
        WHERE e.user_id = ? AND e.category = ?
        AND YEAR(e.expenses_date) = ? 
        AND MONTH(e.expenses_date) BETWEEN ? AND ?
        ORDER BY e.expenses_date DESC`,

    'ค่าคนปลูก': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('ชื่อคนงาน: ', COALESCE(pl.worker_name, 'ไม่ระบุ')), 
                CONCAT('พื้นที่ปลูก: ', COALESCE(pl.land_area, '0'), ' ไร่'), 
                CONCAT('ราคาต่อไร่: ', COALESCE(pl.price_per_rai, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(pl.total_price, '0'), ' บาท')
            ) AS description
        FROM expenses e
        LEFT JOIN Planting pl ON e.expense_id = pl.expense_id
        WHERE e.user_id = ? AND e.category = ?
        AND YEAR(e.expenses_date) = ? 
        AND MONTH(e.expenses_date) BETWEEN ? AND ?
        ORDER BY e.expenses_date DESC`,

    'ค่าคนฉีดยาฆ่าหญ้า': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('จำนวนแกลลอน: ', COALESCE(ws.number_of_cans, '0'), ' แกลลอน'), 
                CONCAT('ราคาต่อแกลลอน: ', COALESCE(ws.price_per_can, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(ws.total_price, '0'), ' บาท')
            ) AS description
        FROM expenses e
        LEFT JOIN WeedSpraying ws ON e.expense_id = ws.expense_id
        WHERE e.user_id = ? AND e.category = ?
        AND YEAR(e.expenses_date) = ? 
        AND MONTH(e.expenses_date) BETWEEN ? AND ?
        ORDER BY e.expenses_date DESC`
        };
        if (!expenseQueries[category]) {
            return res.status(400).json({ message: 'ไม่พบประเภทค่าใช้จ่ายนี้' });
        }

        // ดึงข้อมูลจากฐานข้อมูล
        const [rows] = await db.promise().query(expenseQueries[category], [userId, category, year, startMonth, endMonth]);

        return res.status(200).json({ expenses: rows });

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

exports.getExpensesDetailId = async (req, res) => {
     try {
        const expense_id = req.query.expense_id;

        if (!expense_id) {
            return res.status(400).json({ message: 'กรุณาระบุ expense_id' });
        }

        // ✅ ดึง category จากฐานข้อมูลก่อน
        const [expenseResult] = await db.promise().query(
            `SELECT category FROM expenses WHERE expense_id = ?`, 
            [expense_id]
        );

        if (expenseResult.length === 0) {
            return res.status(404).json({ message: 'ไม่พบค่าใช้จ่ายที่ต้องการ' });
        }

        const category = expenseResult[0].category;

        const expenseQueries = {
            'ค่าฮอร์โมน': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('ยี่ห้อ: ', COALESCE(h.brand, 'ไม่ระบุ')), 
                        CONCAT('ปริมาตร: ', COALESCE(h.volume, '0'), ' ml'),
                        CONCAT('ราคาต่อขวด: ', COALESCE(h.price_per_bottle, '0'), ' บาท'),
                        CONCAT('จำนวน: ', COALESCE(h.quantity, '0'), ' ขวด'),
                        CONCAT('ราคารวม: ', COALESCE(h.total_price, '0'), ' บาท'),
                        CONCAT('สถานที่ซื้อ: ', COALESCE(h.purchase_location, 'ไม่ระบุ'))
                    ) AS description
                FROM expenses e
                LEFT JOIN HormoneData h ON e.expense_id = h.expense_id
                WHERE e.expense_id = ?
                ORDER BY e.expenses_date DESC`,
        
            'ค่าปุ๋ย': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('ยี่ห้อ: ', COALESCE(f.brand, 'ไม่ระบุ')), 
                        CONCAT('สูตร: ', COALESCE(f.formula, 'ไม่ระบุ')), 
                        CONCAT('ราคาต่อกระสอบ: ', COALESCE(f.price_per_bag, '0'), ' บาท'),
                        CONCAT('จำนวน: ', COALESCE(f.quantity, '0'), ' กระสอบ'),
                        CONCAT('ราคารวม: ', COALESCE(f.total_price, '0'), ' บาท'),
                        CONCAT('สถานที่ซื้อ: ', COALESCE(f.purchase_location, 'ไม่ระบุ'))
                    ) AS description
                FROM expenses e
                LEFT JOIN FertilizerData f ON e.expense_id = f.expense_id
                WHERE e.expense_id = ?
                ORDER BY e.expenses_date DESC`,
        
            'ค่ายาฆ่าหญ้า': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('ยี่ห้อ: ', COALESCE(he.brand, 'ไม่ระบุ')), 
                        CONCAT('ปริมาตร: ', COALESCE(he.volume, '0'), ' ml'),
                        CONCAT('ราคาต่อขวด: ', COALESCE(he.price_per_bottle, '0'), ' บาท'),
                        CONCAT('จำนวน: ', COALESCE(he.quantity, '0'), ' ขวด'),
                        CONCAT('ราคารวม: ', COALESCE(he.total_price, '0'), ' บาท'),
                        CONCAT('สถานที่ซื้อ: ', COALESCE(he.purchase_location, 'ไม่ระบุ'))
                    ) AS description
                FROM expenses e
                LEFT JOIN HerbicideData he ON e.expense_id = he.expense_id
                WHERE e.expense_id = ? `,
        
            'ค่าน้ำมัน': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('ราคาต่อลิตร: ', COALESCE(fu.price_per_liter, '0'), ' บาท'),
                        CONCAT('จำนวนลิตร: ', COALESCE(fu.quantity_liters, '0'), ' ลิตร'),
                        CONCAT('ราคารวม: ', COALESCE(fu.total_price, '0'), ' บาท')
                    ) AS description
                FROM expenses e
                LEFT JOIN FuelData fu ON e.expense_id = fu.expense_id
                WHERE e.expense_id = ? `,
        
            'ค่าซ่อมอุปกรณ์': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('อุปกรณ์ที่ซ่อม: ', COALESCE(er.repair_names, 'ไม่ระบุ')), 
                        CONCAT('รายละเอียด: ', COALESCE(er.details, 'ไม่ระบุ')),
                        CONCAT('ค่าซ่อม: ', COALESCE(er.repair_cost, '0'), ' บาท'),
                        CONCAT('ร้านซ่อม: ', COALESCE(er.shop_name, 'ไม่ระบุ'))
                    ) AS description
                FROM expenses e
                LEFT JOIN EquipmentRepairData er ON e.expense_id = er.expense_id
                WHERE e.expense_id = ? `,
        
            'ค่าเช่าที่ดิน': `
                SELECT e.expenses_date, e.category, 
                    CONCAT_WS(' | ', 
                        CONCAT('เจ้าของที่ดิน: ', COALESCE(l.owner_name, 'ไม่ระบุ')), 
                        CONCAT('เบอร์โทร: ', COALESCE(l.owner_phone, 'ไม่ระบุ')),
                        CONCAT('พื้นที่เช่า: ', COALESCE(l.area, '0'), ' ไร่'),
                        CONCAT('ราคาต่อไร่: ', COALESCE(l.price_per_rai, '0'), ' บาท'),
                        CONCAT('ราคารวม: ', COALESCE(l.total_price, '0'), ' บาท')
                    ) AS description
                FROM expenses e
                LEFT JOIN LandRentalData l ON e.expense_id = l.expense_id
                WHERE e.expense_id = ? ` ,
            'ค่าขุด': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('น้ำหนัก: ', COALESCE(ex.weight, '0'), ' กก.'), 
                CONCAT('ราคาต่อตัน: ', COALESCE(ex.price_per_ton, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(ex.total_price, '0'), ' บาท')
            ) AS description
        FROM expenses e
        LEFT JOIN ExcavationData ex ON e.expense_id = ex.expense_id
        WHERE e.expense_id = ? `,

    'ค่าคนฉีดยาฮอโมน': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('จำนวนแกลลอน: ', COALESCE(hs.number_of_cans, '0'), ' แกลลอน'), 
                CONCAT('ราคาต่อแกลลอน: ', COALESCE(hs.price_per_can, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(hs.total_price, '0'), ' บาท')
            ) AS description
        FROM expenses e
        LEFT JOIN HormoneSpraying hs ON e.expense_id = hs.expense_id
        WHERE e.expense_id = ? `,

    'ค่าอุปกรณ์': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('อุปกรณ์: ', COALESCE(ep.item_name, 'ไม่ระบุ')), 
                CONCAT('ร้านค้า: ', COALESCE(ep.shop_name, 'ไม่ระบุ')), 
                CONCAT('ราคา: ', COALESCE(ep.purchase_price, '0'), ' บาท'),
                CONCAT('รายละเอียด: ', COALESCE(ep.descript, 'ไม่ระบุ'))
            ) AS description
        FROM expenses e
        LEFT JOIN EquipmentPurchaseData ep ON e.expense_id = ep.expense_id
        WHERE e.expense_id = ? `,

    'ค่าพันธุ์มัน': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('พันธุ์มัน: ', COALESCE(cv.variety_name, 'ไม่ระบุ')), 
                CONCAT('จำนวน: ', COALESCE(cv.quantity, '0'), ' ต้น'), 
                CONCAT('ราคาต่อต้น: ', COALESCE(cv.price_per_tree, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(cv.total_price, '0'), ' บาท'),
                CONCAT('สถานที่ซื้อ: ', COALESCE(cv.purchase_location, 'ไม่ระบุ'))
            ) AS description
        FROM expenses e
        LEFT JOIN CassavaVarietyData cv ON e.expense_id = cv.expense_id
        WHERE e.expense_id = ? `,

    'ค่าคนตัดต้น': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('จำนวนต้น: ', COALESCE(tc.number_of_trees, '0'), ' ต้น'), 
                CONCAT('ราคาต่อต้น: ', COALESCE(tc.price_per_tree, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(tc.total_price, '0'), ' บาท')
            ) AS description
        FROM expenses e
        LEFT JOIN TreeCutting tc ON e.expense_id = tc.expense_id
        WHERE e.expense_id = ? `,

    'ค่าคนปลูก': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('ชื่อคนงาน: ', COALESCE(pl.worker_name, 'ไม่ระบุ')), 
                CONCAT('พื้นที่ปลูก: ', COALESCE(pl.land_area, '0'), ' ไร่'), 
                CONCAT('ราคาต่อไร่: ', COALESCE(pl.price_per_rai, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(pl.total_price, '0'), ' บาท')
            ) AS description
        FROM expenses e
        LEFT JOIN Planting pl ON e.expense_id = pl.expense_id
        WHERE e.expense_id = ? C`,

    'ค่าคนฉีดยาฆ่าหญ้า': `
        SELECT e.expenses_date, e.category, 
            CONCAT_WS(' | ', 
                CONCAT('จำนวนแกลลอน: ', COALESCE(ws.number_of_cans, '0'), ' แกลลอน'), 
                CONCAT('ราคาต่อแกลลอน: ', COALESCE(ws.price_per_can, '0'), ' บาท'),
                CONCAT('ราคารวม: ', COALESCE(ws.total_price, '0'), ' บาท')
            ) AS description
        FROM expenses e
        LEFT JOIN WeedSpraying ws ON e.expense_id = ws.expense_id
        WHERE e.expense_id = ?`
        };
        if (!expenseQueries[category]) {
            return res.status(400).json({ message: 'ไม่พบประเภทค่าใช้จ่ายนี้' });
        }

        // ✅ ดึงข้อมูลค่าใช้จ่ายตาม expense_id
        const [rows] = await db.promise().query(expenseQueries[category], [expense_id]);

        return res.status(200).json({ expenses: rows });

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
}