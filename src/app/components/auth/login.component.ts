import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { SharedService } from 'src/app/services/shared.service';
import { NgForm } from "@angular/forms";
import { Router, ActivatedRoute } from '@angular/router';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers:[AuthService, SharedService]

})
export class LoginComponent implements OnInit {
	email: string;
  password: string;
  userAuthToken: string;
  nextRoute = '/';

  @ViewChild('form', {static: false}) form: NgForm;

  constructor(private auth: AuthService,
    					private router: Router,
              private route: ActivatedRoute,
              private shared: SharedService,
              private titleService:Title,

    ) {
        this.titleService.setTitle('Login | TeamIt');
     }


  ngOnInit(): void {
    if (this.auth.isAuthenticated() == false){
      this.route.queryParams.subscribe(params => {
        if (params['next'] != undefined){
          this.nextRoute = params['next'];
        }
      });
    }
    else{
      this.router.navigate(['/']);
    }
  }

  
  authenticate = (form: NgForm) => {
    if (form.valid) {
      
      // perform authentication
      this.auth.authenticate(this.email, this.password).subscribe(

        response => {
          sessionStorage.setItem("userToken", response.token);
          sessionStorage.setItem("portals", JSON.stringify(response.portals));
          sessionStorage.setItem("user", JSON.stringify(response.user));
          this.router.navigate([`/${this.nextRoute}`]);
          this.shared.websocketMessagesConnect();
          // this.shared.refreshAppComponent();
        },

        error => { 
          console.log(error);
          if (error.error.non_field_errors) {
            for (let e of error.error.non_field_errors){
              this.shared.setMsg(
              'danger', e, null);
            }
          }
          else {
            this.shared.setMsg(
            'danger', "An error occured. Please retry.", null);
          }
        }
      )
    }
    else {
      this.shared.setMsg('danger', 'Authentication Failed.', null);
    }
  }


  logout() {
    this.auth.logout();
  }
  
  forgotPass = (fForm: NgForm) => {
    $('.modal').modal('hide');
    let data = {
      "email": fForm.value['f_email']
    };

    this.auth.forgotPassword(data).subscribe(
      response => {
        this.shared.setMsg("success", response.detail, null);
      },
      error => {
        console.log(error);
      }
    );
  }
}