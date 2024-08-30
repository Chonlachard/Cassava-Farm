import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MapGeocoder } from '@angular/google-maps'; // ถ้าคุณยังใช้ @angular/google-maps
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-planted-area',
  templateUrl: './add-planted-area.component.html',
  styleUrls: ['./add-planted-area.component.css']
})
export class AddPlantedAreaComponent implements OnInit {


  plantedAreaForm: FormGroup = new FormGroup({}); 
  mapCenter = { lat: 13.7563, lng: 100.5018 };
  zoom = 10;
  polygonCoords: google.maps.LatLngLiteral[] = [];
  polygonOptions: google.maps.PolygonOptions = {
    editable: true,
    draggable: true,
    fillColor: 'red',
    fillOpacity: 0.3,
    strokeColor: 'red',
    strokeOpacity: 0.8,
    strokeWeight: 2,
  };
  searchQuery: string = '';
  isDragging = false;
  currentLocationMarker: google.maps.LatLngLiteral | null = null;
  areaInRai = 0; // พื้นที่ในหน่วยไร่
  areaInNgan = 0; // พื้นที่ในหน่วยงาน
  markers: google.maps.Marker[] = []; // Array to store markers

  userId: string = '';

  constructor(private geocoder: MapGeocoder) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
  }

  onPolygonEdit(event: google.maps.MapMouseEvent): void {
    const path = event.latLng;
    if (path) {
      this.polygonCoords = [...this.polygonCoords, path.toJSON()];
      this.calculateArea(); // คำนวณพื้นที่หลังจากการแก้ไข
    }
  }

  onClearPolygon(): void {
    this.polygonCoords = [];
    this.currentLocationMarker = null;
    this.areaInRai = 0;
    this.areaInNgan = 0;
    this.markers = []; // Clear markers as well
    // ไม่แสดงข้อความแจ้งเตือนเมื่อเคลียร์พิกัด
  }

  onSearchPlace(): void {
    this.geocoder.geocode({ address: this.searchQuery }).subscribe((result) => {
      if (result.results.length > 0) {
        this.mapCenter = result.results[0].geometry.location.toJSON();
        this.zoom = 15;
      } else {
        this.showErrorAlert('ไม่พบสถานที่ตามที่ค้นหา');
      }
    });
  }

  onDragStart(): void {
    this.isDragging = true;
  }

  onSubmit(){}

  onDragEnd(): void {
    this.isDragging = false;
  }

  onCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.mapCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.zoom = 15;
          this.currentLocationMarker = this.mapCenter;
        },
        (error) => {
          console.error('Error getting current location', error);
          // ลบการเรียกใช้งาน showErrorAlert ที่นี่
        }
      );
    } else {
      // ลบการเรียกใช้งาน showErrorAlert ที่นี่
    }
  }

  calculateArea(): void {
    if (this.polygonCoords.length < 3) {
      // เอาการเรียกใช้ showErrorAlert ออกที่นี่
      this.areaInRai = 0;
      this.areaInNgan = 0;
      return;
    }
  
    const polygonPath = this.polygonCoords.map(coord => new google.maps.LatLng(coord.lat, coord.lng));
    const areaInSquareMeters = google.maps.geometry.spherical.computeArea(polygonPath);
  
    // 1 ตารางวา = 4 ตารางเมตร
    const areaInSquareWah = areaInSquareMeters / 4;
  
    // 1 ไร่ = 400 ตารางวา
    const areaInRai = Math.floor(areaInSquareWah / 400);
  
    // เหลือพื้นที่ในตารางวา
    const remainingWah = areaInSquareWah % 400;
  
    // 1 งาน = 100 ตารางวา
    const areaInNgan = Math.floor(remainingWah / 100);
  
    // อัปเดตค่า
    this.areaInRai = areaInRai;
    this.areaInNgan = areaInNgan;
  }
  

  private showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: message
    });
  }
}
