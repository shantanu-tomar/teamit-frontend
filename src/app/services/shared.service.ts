import { Injectable } from '@angular/core';
import { AppComponent } from '../app.component';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';


@Injectable({
  providedIn: 'root'
})
export class SharedService {

  constructor(
    private app: AppComponent,
    private router: Router,
    private api: ApiService,
  ) { }

  setMsg = (colour: string, text: string, title: string ) => {
    this.app.setMsg(colour, text, title);
    this.scrollToTop();
  }

  notAuthorizedMsg = () => {
    this.setMsg(
      'danger', "You, being a non-admin member of this project, cannot perform this action", null);
  }

  setToast = (msg: string, bgColor: string) => {
    let toast = document.getElementById("toast");
    let toastBody = document.getElementById("toastBody");
    let toastIcon = document.getElementById(`toast_${bgColor}`);
    
    toastBody.innerHTML = msg;
    toast.style.backgroundColor = bgColor;
    toastIcon.style.display = 'block';
    toast.className = "show";

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
  }

  // spinner = (state: boolean) => {
  //   this.app.spinner = state;
  // }

  getUrlParts = (url) => {
    var a = document.createElement('a');
    a.href = url;

    return {
        href: a.href,
        host: a.host,
        hostname: a.hostname,
        port: a.port,
        pathname: a.pathname,
        protocol: a.protocol,
        hash: a.hash,
        search: a.search
    };
  }

  scrollToDiv = (id, time) => {
    $('html, body').animate({
      scrollTop: $(`#${id}`).offset().top
    }, time);
  }

  scrollToTop = () => {
    window.scroll(0,0);
  }

  divBottomScroll = (divID) => {
    let element = document.getElementById(divID);
    element.scrollTop = element.scrollHeight;
  }

  isOnline = () => {
    return !this.app.offline;
  }

  getRoleChoices = () => {
    return this.api.getProjectChoices();
  }

  refreshAppComponent = () => {
    this.app.setAuthenticationVars();
  }

  // WEBSOCKET
  websocketMessagesConnect = () => {
    this.app.websocketMessages();
  }

  wsConnect = (wsPath: string) => {
    return this.app.wsConnect(wsPath);
  }

  wsSendMessage(msg: any) {
    return this.app.wsSendMessage(msg);
  }

  wsClose() {
    return this.app.wsClose();
  }

  wsEmit(event, payload) {
    return this.app.wsEmit(event, payload);
  }

}