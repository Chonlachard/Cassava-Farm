import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MapGeocoder } from '@angular/google-maps';
import Swal from 'sweetalert2';
import { CassavaAreaServiceService } from '../cassava-area-service.service';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';

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
  private staticMapsApiUrl = 'https://maps.googleapis.com/maps/api/staticmap';

  constructor(
    private fb: FormBuilder,
    private geocoder: MapGeocoder,
    private plantedAreaService: CassavaAreaServiceService,
    private http: HttpClient,
    private dialogRef: MatDialogRef<AddPlantedAreaComponent>
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
    this.initMap();
  }

  initMap(): void {
    const mapOptions: google.maps.MapOptions = {
      center: this.mapCenter,
      zoom: this.zoom,
      scrollwheel: false, // ปิดการซูมด้วย Scroll Wheel
      zoomControl: true, // เปิดปุ่มซูม
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    const map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

    // การสร้าง Polygon บนแผนที่
    const polygon = new google.maps.Polygon(this.polygonOptions);
    polygon.setMap(map);

    // กำหนด listener สำหรับการแก้ไข polygon
    google.maps.event.addListener(polygon, 'paths_changed', () => {
      this.polygonCoords = polygon.getPath().getArray().map(latLng => latLng.toJSON());
      this.calculateArea();
    });
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

  onCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.mapCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.zoom = 15;
          // this.updateMap(); // อัปเดตตำแหน่งแผนที่
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
        // this.updateMap(); // อัปเดตตำแหน่งแผนที่
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

    // แปลงพิกัดพอลิกอนจาก LatLngLiteral[] เป็น LatLng[]
    const polygonLatLngs = this.polygonCoords.map(coord => new google.maps.LatLng(coord.lat, coord.lng));

    // ส่งข้อมูลพอลิกอนและภาพแผนที่ไปที่ captureMapImage
    this.captureMapImage(polygonLatLngs).then((imageUrl) => {
      const plotName = this.plantedAreaForm.get('plot_name')?.value || 'default-plot-name';
      const timestamp = new Date().toISOString();
      const fileName = `${plotName}-${timestamp}.png`;

      const data = {
        plot_name: plotName,
        latlngs: this.polygonCoords,
        user_id: this.userId,
        fileData: imageUrl // ส่ง URL ของภาพแผนที่
      };

      this.plantedAreaService.savePlantedArea(data).subscribe(
        response => {
          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว'
          });
          
          // ปิด dialog หลังจากบันทึกข้อมูลสำเร็จ
          this.dialogRef.close(true);

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
      console.error('Error capturing image:', error);
      this.showErrorAlert('ไม่สามารถจับภาพแผนที่ได้');
    });
}

  
  onDragEnd(): void {
    this.isDragging = false;
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

  private captureMapImage(polygonCoords: google.maps.LatLng[]): Promise<string> {
    // คำนวณค่ากึ่งกลางของพอลิกอน
    const center = this.calculatePolygonCenter(polygonCoords);
  
    const lat = center.lat();
    const lng = center.lng();
    const zoom = this.zoom;
    const imageSize = '1024x1024';
    const mapType = 'satellite';
    const scale = 2;
  
    // เพิ่มจุดแรกในตำแหน่งสุดท้ายของพิกัดเพื่อให้เส้นเชื่อมจุดสุดท้ายกับจุดแรก
    const closedPolygonCoords = [...polygonCoords, polygonCoords[0]];
  
    // แปลงพิกัดของพอลิกอนเป็นรูปแบบสตริงสำหรับการร้องขอ API
    const polygonPath = closedPolygonCoords.map(coord => `${coord.lat()},${coord.lng()}`).join('|');
  
    // สร้าง URL ของภาพแผนที่ที่รวมพอลิกอน
    const mapImageUrl = `${this.staticMapsApiUrl}?center=${lat},${lng}&zoom=${zoom}&size=${imageSize}&maptype=${mapType}&scale=${scale}&path=color:0xFF0000%7Cweight:2%7C${polygonPath}&key=AIzaSyABE32hZ-0NLz2HZ_0BE9IDiX7SskFUe9M&callback=initMap`;
  
    console.log('Map image URL:', mapImageUrl);
  
    return new Promise((resolve, reject) => {
      this.http.get(mapImageUrl, { responseType: 'blob' }).subscribe(
        (blob: Blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = (reader.result as string).split(',')[1];
            resolve(`data:image/png;base64,${base64data}`);
          };
          reader.readAsDataURL(blob);
        },
        error => {
          console.error('Error fetching map image:', error);
          reject('ไม่สามารถจับภาพแผนที่ได้');
        }
      );
    });
  }
  

  
  // คำนวณค่ากึ่งกลางของพอลิกอน
  private calculatePolygonCenter(polygonCoords: google.maps.LatLng[]): google.maps.LatLng {
    let sumLat = 0;
    let sumLng = 0;
  
    // คำนวณผลรวมของละติจูดและลองจิจูดทั้งหมด
    polygonCoords.forEach(coord => {
      sumLat += coord.lat();
      sumLng += coord.lng();
    });
  
    // คำนวณค่าเฉลี่ยของละติจูดและลองจิจูด
    const centerLat = sumLat / polygonCoords.length;
    const centerLng = sumLng / polygonCoords.length;
  
    // คืนค่าจุดกึ่งกลางในรูปแบบ LatLng
    return new google.maps.LatLng(centerLat, centerLng);
  }
  
  


}
