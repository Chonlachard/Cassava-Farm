// controllers/profileController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ดึงข้อมูลโปรไฟล์
exports.getProfile = (req, res) => {
  const userId = req.query.user_id;

  db.query('SELECT * FROM Users WHERE user_id = ?', [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'ไม่พบโปรไฟล์' });
    }
  });
};

// อัปเดตข้อมูลโปรไฟล์
exports.updateProfile = (req, res) => {
  const userId = req.query.user_id;
  const { firstName, lastName, phone } = req.body;

  db.query('UPDATE Users SET first_name = ?, last_name = ?, phone = ? WHERE user_id = ?', 
    [firstName, lastName, phone, userId], (error) => {
    if (error) {
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลโปรไฟล์' });
    }
    res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ' });
  });
};

// เปลี่ยนรหัสผ่าน
exports.changePassword = (req, res) => {
    const userId = req.query.user_id; // ใช้ query parameter แทน
    const { newPassword } = req.body;
  
    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'user_id และ newPassword จำเป็นต้องมี' });
    }
  
    // เข้ารหัสรหัสผ่านใหม่
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน' });
      }
  
      // อัปเดตรหัสผ่านในฐานข้อมูล
      db.query('UPDATE Users SET password = ? WHERE user_id = ?', 
        [hashedPassword, userId], (error) => {
        if (error) {
          return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
        }
        res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
      });
    });
  };
  
