import { EventEmitter, Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService extends Socket {
  outEven: EventEmitter<any> = new EventEmitter();
  callback: EventEmitter<any> = new EventEmitter();

  constructor() {
    super({
      url: 'https://stage.allrideapp.com/tech_interview',
      options: {
        query: {
          room: 'Namnoh'
        },
        transports: ['websocket']
      }
    });

    // Verificación de conexión al WebSocket.
    this.ioSocket.on('connect', () => {
      console.log('Conectado al socket, ID:', this.ioSocket.id);
    });
  
    // Verificación de desconexión al WebSocket.
    this.ioSocket.on('disconnect', () => {
      console.log('Desconectado del socket.');
    });
  
    // Verificación de error de conexión del WebSocket.
    this.ioSocket.on('connect_error', (error:any) => {
      console.error('Error de conexión al socket:', error);
    });

    this.listen();
  };

  // Función para escuchar las "localizaciones".
  listen = () => {
    console.log('ESCUCHANDO DESDE SOCKET SERVICE')
    this.ioSocket.on('newLocation', (res:any) => this.callback.emit(res));
  };

  // Función para enviar las "localizaciones".
  emitEvent = (coords: { lat: number; lng: number }) => {
    console.log('EMITIENDO DESDE SOCKET SERVICE')
    this.ioSocket.emit('newLocation', coords);
  };
};