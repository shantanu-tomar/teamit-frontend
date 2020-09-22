import { AuthService } from 'src/app/services/auth.service';
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot,
         RouterStateSnapshot, Router, Route } from '@angular/router';
import { Observable } from 'rxjs';


@Injectable()
export class AuthGuard implements CanActivate {


  constructor(private auth: AuthService,
              private _router: Router,
              ) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): 
   Observable<boolean> | Promise<boolean> | boolean {

    if (this.auth.isAuthenticated()) {
      return true;
    }

    // navigate to login page
    this._router.navigate(['/login'], { 
      queryParams: {"next": state.url}});
    return false;
  }

}