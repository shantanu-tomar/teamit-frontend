import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {Observable, pipe, throwError} from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, catchError, delay, tap } from "rxjs/operators";


@Injectable({
  providedIn: 'root'
})
export class AuthService {
	baseUrl: string = environment.baseUrl + '/api';
	httpHeaders = new HttpHeaders({
		'Content-type': 'application/json',
		'X-CSRFToken': this.getCookie('csrftoken'),
	});


	constructor(private _router: Router,
  				private http: HttpClient) { }



	authenticate(email: string, pass: string): Observable<any> {
    return this.http.post(this.baseUrl + '/login/',
	    {"email": email, "password": pass }, {headers: this.httpHeaders});
	 }


	isAuthenticated(): boolean {
    return sessionStorage.getItem('userToken') != null;
	}

  logout() {
    sessionStorage.removeItem("userToken");
    sessionStorage.removeItem("user");
    this._router.navigate(['/login']);
  }

  logoutWithoutRedirect() {
    sessionStorage.removeItem("userToken");
    sessionStorage.removeItem("user");

  }
  

  forgotPassword(data): Observable<any> {
    return this.http.post(this.baseUrl + '/password-reset/',
      data, {headers: this.httpHeaders});
   }

	getCookie(name: string) {
	    let ca: Array<string> = document.cookie.split(';');
	    let caLen: number = ca.length;
	    let cookieName = `${name}=`;
	    let c: string;

	    for (let i: number = 0; i < caLen; i += 1) {
	        c = ca[i].replace(/^\s+/g, '');
	        if (c.indexOf(cookieName) == 0) {
	            return c.substring(cookieName.length, c.length);
	        }
	    }
	    return '';
	}

	register(data): Observable<any> {
    return this.http.post(
      this.baseUrl + '/register/', data,
      {headers: this.httpHeaders});
  }

  

}