import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, delay } from "rxjs/operators";
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
	baseUrl: string = environment.baseUrl + '/api';

	httpHeaders = new HttpHeaders({
		"Content-Type": "application/json",
		"X-CSRFToken": this.getCookie('csrftoken')
	});

	constructor(private http: HttpClient) { }

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


  getHome(): Observable<any>{
    return this.http.get(this.baseUrl +'/home/',
      {headers: this.httpHeaders});
  }


  getPortals(): Observable<any>{
    return this.http.get(this.baseUrl +'/portals/',
      {headers: this.httpHeaders});
  }


  getProjects(portal): Observable<any>{
    return this.http.get(this.baseUrl +`/portals/${portal}/projects/`,
    	{headers: this.httpHeaders});
  }


  getProjectDetails(portal: string, id: number): Observable<any>{
    return this.http.get(this.baseUrl +`/portals/${portal}/projects/${id}`,
      {headers: this.httpHeaders});
  }


  partialUpdateProject(portal: string, id: number, data: object): Observable<any>{
    return this.http.patch(this.baseUrl +`/portals/${portal}/projects/${id}/`, data,
      {headers: this.httpHeaders});
  }

  getProjectChoices(): Observable<any>{
    return this.http.get(this.baseUrl +'/get-project-choices/',
      {headers: this.httpHeaders});
  }

  getMembers(portal: string, id: number): Observable<any>{
    return this.http.get(this.baseUrl +`/portals/${portal}/projects/${id}/`,
      {headers: this.httpHeaders});
  }

  memberUpdate(portal: string, projId: number, memId: number, data: object): Observable<any>{
    return this.http.patch(
      this.baseUrl +`/portals/${portal}/projects/${projId}/members/${memId}/`, data,
      {headers: this.httpHeaders});
  }

  memberInvite(portal: string, projId: number, data: object): Observable<any>{
    return this.http.post(
      this.baseUrl +`/portals/${portal}/projects/${projId}/invite/`, data,
      {headers: this.httpHeaders});
  }

  verifyToken(url: string): Observable<any>{
    return this.http.get(
      this.baseUrl +`${url}/`, {headers: this.httpHeaders});
  }

  addMember(portal: string, projId: number, data: object): Observable<any>{
    return this.http.post(
      this.baseUrl +`/portals/${portal}/projects/${projId}/members/`, data, 
      {headers: this.httpHeaders});
  }


  // MILESTONES

  getProjectMilestones(portal: string, projId: number): Observable<any>{
    return this.http.get(
      this.baseUrl +`/portals/${portal}/projects/${projId}/milestones/`, 
      {headers: this.httpHeaders});
  }

  getMilestone(portal: string, projId: number, mileId: number): Observable<any>{
    return this.http.get(
      this.baseUrl +`/portals/${portal}/projects/${projId}/milestones/${mileId}/`, 
      {headers: this.httpHeaders});
  }

  milestoneUpdate(portal: string, projId: number, mileId: number, data: object): Observable<any>{
    return this.http.patch(
      this.baseUrl +`/portals/${portal}/projects/${projId}/milestones/${mileId}/`, data,
      {headers: this.httpHeaders});
  }

  addMilestone(portal: string, projId: number, data: object): Observable<any>{
    return this.http.post(
      this.baseUrl +`/portals/${portal}/projects/${projId}/milestones/`, data,
      {headers: this.httpHeaders});
  }

  milestoneComment(portal: string, projId: number, mileId: number, data: object): Observable<any>{
    return this.http.post(
      this.baseUrl +`/portals/${portal}/projects/${projId}/milestones/${mileId}/comment/`, data,
      {headers: this.httpHeaders});
  }

  deleteMilestone(portal: string, projId: number, mileId: number): Observable<any>{
    return this.http.delete(
      this.baseUrl +`/portals/${portal}/projects/${projId}/milestones/${mileId}/`,
      {headers: this.httpHeaders});
  }


  // TICKETS

  ticketUpdate(portal: string, projId: number, tickId: number, data: object): Observable<any>{
    return this.http.patch(
      this.baseUrl +`/portals/${portal}/projects/${projId}/tickets/${tickId}/`, data,
      {headers: this.httpHeaders});
  }

  addTicket(portal: string, projId: number, data: object): Observable<any>{
    return this.http.post(
      this.baseUrl +`/portals/${portal}/projects/${projId}/tickets/`, data,
      {headers: this.httpHeaders});
  }

  ticketComment(portal: string, projId: number, tickId: number, data: object): Observable<any>{
    return this.http.post(
      this.baseUrl +`/portals/${portal}/projects/${projId}/tickets/${tickId}/comment/`, data,
      {headers: this.httpHeaders});
  }

  deleteTicket(portal: string, projId: number, tickId: number): Observable<any>{
    return this.http.delete(
      this.baseUrl +`/portals/${portal}/projects/${projId}/tickets/${tickId}/`,
      {headers: this.httpHeaders});
  }

  // Messages
  getChats(): Observable<any>{
    return this.http.get(
      this.baseUrl +'/messages/', {headers: this.httpHeaders});
  }

  getChat(roomType: string, roomId: string): Observable<any>{
    return this.http.get(
      this.baseUrl +`/messages/${roomType}/${roomId}/`,
        {headers: this.httpHeaders});
  }

  // Profile
  getProfile(): Observable<any>{
    return this.http.get(this.baseUrl + '/profile/', {headers: this.httpHeaders});
  }

  updateProfile(formData): Observable<any>{
    return this.http.post(this.baseUrl + '/profile/', formData);
  }
}