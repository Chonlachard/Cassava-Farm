const moment = require('moment'); 
const db = require('../config/db'); // ใช้ db สำหรับเชื่อมต่อฐานข้อมูล

// ฟังก์ชันสำหรับดึงข้อมูลค่าใช้จ่าย
exports.getExpense = async (req, res) => {
    const userId = req.query.user_id;

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!userId) {
        return res.status(400).json({ message: 'กรุณาระบุ user_id' });
    }

    const query = 'SELECT * FROM expenses WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย' });
        }

        // แปลงวันที่จาก yyyy-mm-dd เป็น dd-mm-yyyy
        const formattedResults = results.map(expense => ({
            ...expense,
            expense_date: moment(expense.expense_date).format('DD-MM-YYYY')
        }));

        // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
        res.json(formattedResults);
    });
};

// ฟังก์ชันสำหรับเพิ่มข้อมูลค่าใช้จ่าย
exports.addExpense = async (req, res) => {
    const { user_id, expense_date, category, amount, details } = req.body;

    if (!user_id || !expense_date || !category || !amount ) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const query = 'INSERT INTO expenses (user_id, expense_date, category, amount, details) VALUES (?, ?, ?, ?, ?)';
    try {
        await new Promise((resolve, reject) => {
            db.query(query, [user_id, expense_date, category, amount, details], (err, results) => {
                if (err) {
                    console.error('Database query error:', err); // เพิ่มการพิมพ์ข้อผิดพลาดที่เกิดขึ้น
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
        res.json({ message: 'เพิ่มข้อมูลค่าใช้จ่ายสำเร็จ' });
    } catch (err) {
        console.error('Error executing query:', err.stack); // เพิ่มการพิมพ์ข้อผิดพลาดที่เกิดขึ้น
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลค่าใช้จ่าย' });
    }
};

// ฟังก์ชันสำหรับแก้ไขข้อมูลค่าใช้จ่าย
exports.deleteExpense = async (req, res) => {
    const expenseId = req.params.expense_id;

    if (!expenseId) {
        return res.status(400).json({ message: 'กรุณาระบุ expense_id' });
    }

    const query = 'DELETE FROM expenses WHERE expense_id = ?';
    try {
        const result = await new Promise((resolve, reject) => {
            db.query(query, [expenseId], (err, results) => {
                if (err) {
                    console.error('Database query error:', err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        if (result.affectedRows === 0) {
            // ไม่มีข้อมูลที่ตรงกับ expense_id
            return res.status(404).json({ message: 'ไม่พบข้อมูลค่าใช้จ่ายที่ต้องการลบ' });
        }

        res.json({ message: 'ลบข้อมูลค่าใช้จ่ายสำเร็จ' });
    } catch (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลค่าใช้จ่าย' });
    }
};

exports.updateExpense = async (req, res) => {
    const { expense_id, user_id, expense_date, category, amount, details } = req.body;
  
    try {
      // ตรวจสอบข้อมูลที่มีอยู่
      const [rows] = await db.promise().query('SELECT * FROM expenses WHERE expense_id = ?', [expense_id]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลค่าใช้จ่าย' });
      }
  
      // อัพเดตข้อมูล
      await db.promise().query(
        `UPDATE expenses SET user_id = ?, expense_date = ?, category = ?, amount = ?, details = ? WHERE expense_id = ?`,
        [user_id, expense_date, category, amount, details, expense_id]
      );
  
      res.status(200).json({ message: 'อัพเดตข้อมูลค่าใช้จ่ายสำเร็จ' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูลค่าใช้จ่าย', error });
    }
  };

  exports.getExpenseEdit = async (req, res) => {
    const expenseId = req.params.expense_id;
  
    // ตรวจสอบว่ามีการส่ง expense_id มาหรือไม่
    if (!expenseId) {
      return res.status(400).json({ message: 'กรุณาระบุ expense_id' });
    }
  
    const query = 'SELECT * FROM expenses WHERE expense_id = ?';
    db.query(query, [expenseId], (err, results) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลค่าใช้จ่าย' });
      }
  
      // ตรวจสอบว่าพบข้อมูลหรือไม่
      if (results.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลค่าใช้จ่าย' });
      }
  
      // แปลงวันที่
      const formattedResult = {
        ...results[0],
        expense_date: moment(results[0].expense_date).format('YYYY-MM-DD')
      };
  
      // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
      res.json(formattedResult);
    });
  };
  

  
  




