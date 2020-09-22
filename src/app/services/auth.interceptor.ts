import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpEvent, HttpResponse, HttpRequest, HttpHandler } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>,
            next: HttpHandler,
            ): Observable<HttpEvent<any>> {

      const userAuthToken = sessionStorage.getItem("userToken");

      if (userAuthToken) {
          const cloned = req.clone({
              headers: req.headers.set("Authorization",
                  "Token " + userAuthToken)
          });
    
          return next.handle(cloned);
      }
      else {
          return next.handle(req);
      }

  }
}
    