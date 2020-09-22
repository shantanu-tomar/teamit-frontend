import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';
import { NgForm } from '@angular/forms';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-add-member',
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.css'],
  providers: [ApiService, SharedService]
})
export class AddMemberComponent implements OnInit {
  status: string = 'verifying';
  portal: string;
  projectId: number;
  email: string;
  role: string;
  user: object;
  username: string;

	constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private shared: SharedService,
    private titleService: Title,
  ) {
      this.titleService.setTitle('Add Member | TeamIt');
  }

  ngOnInit(): void {
    this.verifyToken();
  }

  verifyToken = () => {
    let url = this.route.snapshot['_routerState']['url'] +'==';
    this.portal = this.route.params['_value']['portal'];
    this.projectId = this.route.params['_value']['id'];

    this.api.verifyToken(url).subscribe(
      response => {
        this.email = response.email;
        this.role = response.role;
        this.status = 'approved';

        if (response.user_exists == true) {
          this.user = response.user;
          this.username = response.user['name'];
          console.log(this.user);
        }
      },
      error => {
        this.status = 'error';
        this.shared.setMsg("danger", error.error, null);
      }
    );
  }

  addMember = (form: NgForm) => {
    let formData = form.value;

    formData['portal'] = this.portal;
    formData['project'] = this.projectId;
    formData['email'] = this.email;
    formData['role'] = this.role;
    formData['user_exists'] = this.user != undefined;

    if (this.user) {
      formData['name'] = this.user['name'];
    }

    this.api.addMember(this.portal, this.projectId, formData).subscribe(
      response => {
        this.shared.setToast("Member Created", "green");
        this.router.navigate(['login']);
      },
      error => {
        console.log(error);
        this.shared.setMsg("danger", error.error, null);
      }
    );
  }
}
