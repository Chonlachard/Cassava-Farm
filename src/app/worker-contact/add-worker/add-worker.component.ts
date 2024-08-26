// add-worker.component.ts

import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { WorkerContactService } from '../worker-contact.service';
import { Worker } from '../../../interfaces/worker.model';

@Component({
  selector: 'app-add-worker',
  templateUrl: './add-worker.component.html',
  styleUrls: ['./add-worker.component.css']
})
export class AddWorkerComponent implements OnInit {
  newWorker: Worker = {
    user_id: 0, // จะถูกตั้งค่าเมื่อดึงข้อมูลจาก localStorage
    worker_name: '',
    phone: '',
    skills: []  // ตั้งค่าเริ่มต้นเป็นอาเรย์ว่างอย่างถูกต้อง
  };
  availableSkills = ['Skill1', 'Skill2', 'Skill3']; // แทนที่ด้วยทักษะจริงของคุณ
  userId: string = ''; // เก็บ user_id ที่ดึงมาจาก localStorage

  constructor(
    public dialogRef: MatDialogRef<AddWorkerComponent>,
    private workerService: WorkerContactService
  ) {}

  ngOnInit(): void {
    // ดึง user_id จาก localStorage เมื่อคอมโพเนนต์ถูกสร้าง
    this.userId = localStorage.getItem('user_id') || '';

    if (this.userId) {
      this.newWorker.user_id = parseInt(this.userId, 10); // แปลง user_id เป็นตัวเลขและตั้งค่าให้ newWorker
    } else {
      console.error('User ID is not set in localStorage.');
    }
  }

  addWorker(): void {
    if (!this.newWorker.worker_name) {
      console.error('Worker Name is required.');
      return;
    }

    // ใช้ตรงๆกับอาเรย์ของ skills
    this.workerService.createWorker(this.newWorker).subscribe({
      next: (response) => {
        console.log('Worker added:', response);
        this.resetNewWorker();
        this.closeDialog();
      },
      error: (err) => this.handleError(err)
    });
  }

  onSkillChange(event: any, skill: string): void {
    // ตรวจสอบให้แน่ใจว่า skills ถูกตั้งค่าเป็นอาเรย์
    if (!this.newWorker.skills) {
      this.newWorker.skills = [];
    }

    if (event.checked) {
      this.newWorker.skills.push(skill);
    } else {
      const index = this.newWorker.skills.indexOf(skill);
      if (index >= 0) {
        this.newWorker.skills.splice(index, 1);
      }
    }
  }

  resetNewWorker(): void {
    this.newWorker = {
      user_id: parseInt(this.userId, 10), // ใช้ user_id จาก localStorage
      worker_name: '',
      phone: '',
      skills: []  // รีเซ็ตให้เป็นอาเรย์ว่าง
    };
  }

  handleError(err: any): void {
    console.error('Error adding worker:', err);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
