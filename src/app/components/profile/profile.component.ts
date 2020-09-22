import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [ApiService, SharedService ],
})
export class ProfileComponent implements OnInit {
  form: FormGroup;
  userName = new FormControl();
  userEmail = new FormControl();

  profileImg: any;
  orders = [];
  wishlist = [];
  productsTracking = [];


  constructor(private api: ApiService,
              private router: Router,
              private formBuilder: FormBuilder,
              private shared: SharedService,
              private titleService: Title,

              ) {
                  this.titleService.setTitle('Profile | TeamIt');
               }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      imageSelect: [''],
      });
    this.getProfile();
  }

  getProfile = () => {
    this.api.getProfile().subscribe(
      data => {
      	this.setVariables(data);
      },

      error => {
        console.log(error);
      }
    )
  }

  setVariables = (data) => {
    this.userName.setValue(data.user.name);
    this.userEmail.setValue(data.user.email);
    this.profileImg = data.user.image;

  }

  updateProfile = () => {
    const formData = new FormData();
    formData.append("name", this.userName.value);
    formData.append("email", this.userEmail.value);
    formData.append("image", this.form.get('imageSelect').value);
    
    this.api.updateProfile(formData).subscribe(
      response => {
        this.shared.setToast("Updated!", "green");
        this.getProfile();
      },
      error => {
        console.log(error);
      }
    )
  }

  fileUpload = (event) => {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.form.get('imageSelect').setValue(file);
    }
  }
}