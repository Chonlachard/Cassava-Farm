// src/interfaces/worker.model.ts

export interface Worker {
    worker_id?: number;      // ID ของพนักงาน (Primary Key), เป็น optional เพราะอาจจะไม่จำเป็นต้องใช้ในขั้นตอนการสร้างใหม่
    user_id: number;         // ID ของผู้ใช้ที่เกี่ยวข้อง (ต้องกรอก)
    worker_name: string;     // ชื่อพนักงาน (ต้องกรอก)
    phone?: string;          // เบอร์โทรศัพท์ (สามารถไม่กรอกได้)
    skills: string[];          // ทักษะต่างๆ ของพนักงาน จัดเก็บเป็น TEXT หรือ JSON ในฐานข้อมูล
  }