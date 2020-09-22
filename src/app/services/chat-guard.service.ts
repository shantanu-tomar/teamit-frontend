import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router";
import { MessagesComponent } from 'src/app/components/messages/messages.component';


@Injectable()
export class ChatGuard {
    private firstNavigation = true;

    constructor(private router: Router) { }
    
    canActivate(route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): boolean {

        if (this.firstNavigation) {
            this.firstNavigation = false;
            if (route.component != MessagesComponent) {
                this.router.navigate(["/messages"]);
                return false;
            }
        }
        return true;
    }
}