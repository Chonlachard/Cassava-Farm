import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MapGeocoder } from '@angular/google-maps';
import Swal from 'sweetalert2';
import { CassavaAreaServiceService } from '../cassava-area-service.service';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-add-planted-area',
  templateUrl: './add-planted-area.component.html',
  styleUrls: ['./add-planted-area.component.css']
})
export class AddPlantedAreaComponent implements OnInit {

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  autoGeneratedName: string = '';
  plantedAreaForm: FormGroup;
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
  isDragging = false;
  currentLocationMarker: google.maps.LatLngLiteral | null = null;
  areaInRai = 0;
  areaInNgan = 0;
  markers: google.maps.Marker[] = [];
  userId: string = '';
  existingPlotNames: string[] = [];

  constructor(
    private fb: FormBuilder,
    private geocoder: MapGeocoder,
    private plantedAreaService: CassavaAreaServiceService
  ) {
    this.plantedAreaForm = this.fb.group({
      plot_name: [{ value: '', disabled: false }, Validators.required],
      area_rai: [{ value: '', disabled: true }],
      searchQuery: ['']
    });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    this.generatePlotName();
  }

  onPolygonEdit(event: google.maps.MapMouseEvent): void {
    const path = event.latLng;
    if (path) {
      this.polygonCoords = [...this.polygonCoords, path.toJSON()];
      this.calculateArea();
    }
  }

  onClearPolygon(): void {
    this.polygonCoords = [];
    this.currentLocationMarker = null;
    this.areaInRai = 0;
    this.areaInNgan = 0;
    this.markers = [];
  }

  onSearchPlace(): void {
    const searchQuery = this.plantedAreaForm.get('searchQuery')?.value;

    if (!searchQuery) {
      this.showErrorAlert('โปรดระบุที่อยู่ในการค้นหา');
      return;
    }

    this.geocoder.geocode({ address: searchQuery }).subscribe((result) => {
      if (result.results.length > 0) {
        this.mapCenter = result.results[0].geometry.location.toJSON();
        this.zoom = 15;
      } else {
        this.showErrorAlert('ไม่พบสถานที่ตามที่ค้นหา');
      }
    }, error => {
      console.error('Error during geocoding:', error);
      this.showErrorAlert('เกิดข้อผิดพลาดในการค้นหา');
    });
  }

  onDragStart(): void {
    this.isDragging = true;
  }

  onSubmit(): void {
    if (this.plantedAreaForm.invalid) {
      this.showErrorAlert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    this.captureMapScreenshot().then((screenshotBase64) => {
      const plotName = this.plantedAreaForm.get('plot_name')?.value || 'default-plot-name';

      // สร้างชื่อไฟล์ที่ไม่ซ้ำกันโดยการเพิ่ม timestamp
      const timestamp = new Date().toISOString();
      const fileName = `${plotName}-${timestamp}.png`;

      const data = {
        plot_name: plotName,
        latlngs: this.polygonCoords,
        user_id: this.userId,
        fileData: `data:image/png;base64,${screenshotBase64}` // ส่ง Base64 string แทน Blob
      };

      this.plantedAreaService.savePlantedArea(data).subscribe(
        response => {
          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว'
          });
          this.plantedAreaForm.reset();
          this.onClearPolygon();
          this.generatePlotName();
        },
        error => {
          console.error('Error:', error);
          this.showErrorAlert('ไม่สามารถบันทึกข้อมูลได้');
        }
      );
    }).catch(error => {
      console.error('Error capturing screenshot:', error);
      this.showErrorAlert('ไม่สามารถจับภาพหน้าจอได้');
    });
  }
  
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
          this.showErrorAlert('ไม่สามารถระบุตำแหน่งปัจจุบันได้');
        }
      );
    } else {
      this.showErrorAlert('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
    }
  }

  calculateArea(): void {
    if (this.polygonCoords.length < 3) {
      this.areaInRai = 0;
      this.areaInNgan = 0;
      return;
    }

    const polygonPath = this.polygonCoords.map(coord => new google.maps.LatLng(coord.lat, coord.lng));
    const areaInSquareMeters = google.maps.geometry.spherical.computeArea(polygonPath);
    const areaInSquareWah = areaInSquareMeters / 4;
    const areaInRai = Math.floor(areaInSquareWah / 400);
    const remainingWah = areaInSquareWah % 400;
    const areaInNgan = Math.floor(remainingWah / 100);

    this.areaInRai = areaInRai;
    this.areaInNgan = areaInNgan;

    this.plantedAreaForm.get('area_rai')?.setValue(this.areaInRai.toString());
  }

  generatePlotName(): void {
    let newPlotNumber = 1;
    while (this.existingPlotNames.includes(`แปลงที่${newPlotNumber}`)) {
      newPlotNumber++;
    }
    const newPlotName = `แปลงที่${newPlotNumber}`;
    this.autoGeneratedName = newPlotName;
    this.plantedAreaForm.get('plot_name')?.setValue(newPlotName);
    this.existingPlotNames.push(newPlotName);
  }

  private showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: message
    });
  }

  private captureMapScreenshot(): Promise<string> {
    return html2canvas(this.mapContainer.nativeElement).then(canvas => {
      return canvas.toDataURL('image/png').split(',')[1]; // ส่งเฉพาะ Base64 ส่วนที่เป็นข้อมูล
    }).catch(error => {
      console.error('Error capturing screenshot:', error);
      return '';
    });
  }
}
