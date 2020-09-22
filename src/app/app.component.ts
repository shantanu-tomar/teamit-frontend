import { Component, OnInit, Input } from '@angular/core';
import { Observable, Observer, fromEvent, merge, EMPTY, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { WebSocketService } from 'src/app/services/web-socket-service.service';
import { AuthService } from 'src/app/services/auth.service';

import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../environments/environment';
import { catchError, tap, switchAll } from 'rxjs/operators';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    WebSocketService, AuthService,
  ]
})
export class AppComponent implements OnInit{
  title = 'TomBug';

  offline: boolean = false;
  messages = [];
  incomingCall: object;
  
  WS_ENDPOINT = environment.wsEndpoint;
  socket$: WebSocketSubject<any>;  
  
  constructor(
    private router: Router,
    private socket: WebSocketService,
    private auth: AuthService,
  ){
    if (this.auth.isAuthenticated()) {
      this.websocketMessages();
    }
    }

  ngOnInit(): void {
    this.getNavHeight();

    this.createOnline$().subscribe(
      isOnline => {
        if (!isOnline) {
          this.offline = true;
        }
        else {
          this.offline = false;
        }
      }
    );
  }

  setMsg = (colour: string, text: string, title: string) => {
	  this.messages.push({
	    "colour": colour,
	    "title": title,
	    "text": text,
	  });
  }

  createOnline$() {
    return merge<boolean>(
      fromEvent(window, 'offline').pipe(map(() => false)),
      fromEvent(window, 'online').pipe(map(() => true)),
      new Observable((sub: Observer<boolean>) => {
        sub.next(navigator.onLine);
        sub.complete();
      }
    ));
  }

  getNavHeight = () => {
    let height = document.getElementById('desktopNav').offsetHeight;
    return height;
  }

  mobileNav = (link) => {
    this.router.navigate([`/${link}`]);
  }

  websocketMessages = () => {
    let wsPath = `/ws/messages/`;

    setTimeout(() => { 
      this.wsConnect(wsPath).subscribe(
        response => {
          switch (response.type) {
            case 'message':
              break;

            case 'videochat_offer':
              console.log("Video Chat Incoming");
              this.handleIncomingCall(response);
              break;

            case 'jitsi_offer':
              console.log("Jitsi Chat Incoming");
              this.handleIncomingCall(response);
              break;
          }
        },
        error => {
          console.log(error);
        }
      );
      }, 500);
  }

  handleIncomingCall = (incoming) => {
    document.getElementById('caller_name').innerHTML = incoming.payload.caller_name;
    $('#callOfferModal').modal('show');
    this.incomingCall = incoming;
  }


  callAnswered = () => {
    $('#callOfferModal').modal('hide');
    const roomId = this.incomingCall['payload']['target'];
    const roomType = this.incomingCall['payload']['target_type'];
    
    this.router.navigate([`/messages/${roomType}/${roomId}/video-chat`], 
      {state: {incoming: this.incomingCall}});

  }

  // Websocket

  wsConnect(wsPath: string): Observable<any> {
    if (this.socket$ == undefined || this.socket$.closed) {
      console.log(this.socket$);
      const userAuthToken = sessionStorage.getItem("userToken");
      let url = this.WS_ENDPOINT + wsPath +`?auth=${userAuthToken}`;
      
      this.socket$ = webSocket(url);
      console.log(this.socket$);
      return this.socket$;
    }
    else if (this.socket$) {
      return this.socket$;
    }

  }
  
  wsSendMessage(msg: any) {
    if (this.socket$) {
      this.socket$.next(msg);
    } else {
      console.error('Did not send data, open a connection first');
    }
  }

  wsClose() {
    if (this.socket$) {
      this.socket$.complete();
      console.log("socket disconnected !");
    }
  }

  wsEmit(event, payload) {
    let data = {
      "event": event,
      "payload": payload
    };
    this.wsSendMessage(data);
  }

}
