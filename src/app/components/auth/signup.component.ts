import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { SharedService } from 'src/app/services/shared.service';
import { NgForm } from "@angular/forms";
import { Router } from '@angular/router';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  providers:[AuthService, SharedService]

})
export class SignupComponent implements OnInit {
  public name: string;
  public email: string;
  public password1: string;
  public password2: string;
  public userAuthToken: string;
  public message = { };


  constructor(private auth: AuthService,
              private router: Router,
              private shared: SharedService,
              private titleService:Title,

    ) {
        this.titleService.setTitle('Signup | TeamIt');

     }

  ngOnInit(): void {
  }

  signup(form: NgForm) {
    if (form.value["password1"] != form.value["password2"]) {
      this.shared.setMsg('danger', "The two password fields must match!", null);
    }

    if (form.valid) {
      // perform authentication
      let data = {
        "name": form.value["name"],
        "email": form.value["email"],
        "password1": form.value["password1"],
        "password2": form.value["password2"]
      };

      this.auth.register(data).subscribe(

        response => {
          if (response) {
            sessionStorage.setItem("userToken", JSON.stringify(response.token));
            sessionStorage.setItem("user", JSON.stringify(response.user));
            this.router.navigate(['/']);
            // this.shared.refreshAppComponent();
          }
        },

        error => {
          
          if (error.error.email){
            this.shared.setMsg('danger', error.error.email, null);
          }
          else if (error.error.name){
            this.shared.setMsg('danger', error.error.name, null);
          }
          else{
            this.shared.setMsg('danger', `Error ${error.status}: ${error.statusText}`, null)
          }
        }
      )
    }
    else {
      this.shared.setMsg('danger', 'User registration failed.', null);
    }
  }

}
  