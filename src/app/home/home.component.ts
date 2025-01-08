import { Component, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { WebSocketService } from '../services/web-socket.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MapsAPILoader } from '@agm/core';

declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements AfterViewInit {
  // Se crean y asignan las variables a utilizar.
  @ViewChild('addressInput') addressInput!: ElementRef;
  
  address: string = '';
  // Coordenadas iniciales Santiago de Chile.
  center: { lat: number; lng: number } = { lat: -33.4489, lng: -70.6693 };
  zoom: number = 11;
  markers: { lat: number; lng: number }[] = [];
  autocomplete: any;
  map!: google.maps.Map;

  constructor(
    private socketWebService: WebSocketService,
    private ngZone: NgZone,
    private http: HttpClient,
    private mapsAPILoader: MapsAPILoader) {
    // Se hace la conexión al callback del service creado para el Web Socket.
    socketWebService.callback.subscribe((coords: { lat: number; lng: number }) => {
      this.markers.push(coords);
      this.adjustBounds();
    });
  };
  
  // Se carga la API de autocomplete de googlemaps.
  ngAfterViewInit() {
    this.mapsAPILoader.load().then(() => {
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        this.autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement, {
          types: ['address'],
          // Se hace una restricción del autocomplete para solo Chile.
          componentRestrictions: { country: 'cl' }
        });

        // Escucha los cambios en el input de la dirección.
        this.autocomplete.addListener('place_changed', () => {
          this.ngZone.run(() => {
            // Obtiene el lugar seleccionado por el usuario.
            const place: google.maps.places.PlaceResult = this.autocomplete.getPlace();
    
            if (place.geometry === undefined || place.geometry === null) {
              return;
            }
    
            // Obtiene el nombre completo de la dirección seleccionada.
            const fullAddress = place.formatted_address;
            this.address = fullAddress ?? '';
          });
        });
      } else {
        console.error('Google Maps Places API no está disponible.');
      }
    });
  };

  onMapReady(map:google.maps.Map): void {
    this.map = map;
    console.log('Mapa listo:', map);
  }

  // ?: Función para clickear y marcar ubicación en el mapa, puede ser una posible funcionalidad.
  // onMapClick(event: any): void {
  //   const lat = event.coords.lat;
  //   const lng = event.coords.lng;
  
    // Añade un marcador en la ubicación donde se hizo click.
    // this.addMarker(lat, lng);
  // }

  // Función para agregar la marca de la dirección ingresada.
  addMarker(lat: number, lng: number): void {
    this.markers.push({ lat: lat, lng: lng });
  };

  // Función que se ejecuta al apretar el botón "enviar".
  sendAddress() {
    if (this.address != '') {
      console.log("Dirección Ingresada: ", this.address)
      this.geocodeAddress(this.address);
      this.address = '';
    }
  };
  
  // Función para ajustar el zoom de forma automática al agregar una "mark" (dirección). 
  adjustBounds() {
    const bounds: google.maps.LatLngBounds = new google.maps.LatLngBounds();
    for (const marker of this.markers) {
      bounds.extend(new google.maps.LatLng(marker.lat, marker.lng));
    }
    if (this.map) {
      this.map.fitBounds(bounds);
    }
  };

  // Función que maneja la geolocalización de las coordenadas.
  async geocodeAddress(address: string) {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${environment.googleMapsApiKey}`;

    await this.http.get(geocodeUrl).subscribe((result: any) => {
      if (result.status === 'OK') {
        const location = result.results[0].geometry.location;
        const coords = { lat: location.lat, lng: location.lng };

        // Se guarda la ubicación en los marcadores.
        this.markers.push(coords);
        
        // Se ajusta el zoom para que aparezcan ambos.
        this.adjustBounds();
        
        // Se envían las coordenadas vía Socket.IO
        this.sendCoordinates(coords);
      } else if (result.status === 'ZERO_RESULTS') {
        console.error('No se encontraron resultados para la dirección proporcionada.');
        alert('No se encontraron resultados para la dirección proporcionada. Por favor, verifica la dirección e intenta nuevamente.');
      } else {
        console.error('Geocoding no tuvo éxito debido a: ' + result.status);
      }
    });
  };

  // Función que envía las coordenadas al service del web socket.
  sendCoordinates(coords: { lat: number; lng: number }) {
    console.log('Se envían coordenadas desde home.component.');
    this.socketWebService.emitEvent(coords);
  };
};