import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';
import { catchError, tap, switchAll } from 'rxjs/operators';
import { EMPTY, Subject, Observable } from 'rxjs';

export const WS_ENDPOINT = environment.wsEndpoint;

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  socket$: WebSocketSubject<any>;  
  
  connect(wsPath: string): Observable<any> {
    if (this.socket$ == undefined || this.socket$.closed) {

      const userAuthToken = sessionStorage.getItem("userToken");
      let url = WS_ENDPOINT + wsPath +`?auth=${userAuthToken}`;
      
      this.socket$ = webSocket(url);
      return this.socket$;
    }
    else if (this.socket$) {
      return this.socket$;
    }

  }
  
  sendMessage(msg: any) {
    if (this.socket$) {
      this.socket$.next(msg);
    } else {
      console.error('Did not send data, open a connection first');
    }
  }

  close() {
    if (this.socket$) {
      this.socket$.complete();
      console.log("socket disconnected !");
    }
  }

  emit(event, payload) {
    let data = {
      "event": event,
      "payload": payload
    };
    this.sendMessage(data);
  }

}
