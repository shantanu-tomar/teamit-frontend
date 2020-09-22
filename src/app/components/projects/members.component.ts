import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';
import { LocalDataSource } from 'ng2-smart-table';
import { NgForm } from '@angular/forms';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css'],
  providers: [ApiService, SharedService]
})
export class MembersComponent implements OnInit {

	settings = {
    actions: {
      delete: false, 
    },
    edit: {
      editButtonContent: '<i class="btn-sm btn-warning w-100">Details</i>',
    },
    add: {
      addButtonContent: '<i class="btn btn-info w-100">Add</i>',
    },
    columns: {
      id: {
        title: 'ID',
        type: 'number',
        editable: false,
        width:"10%",
      },
      name: {
        title: 'Name',
        type: 'string',
        editable: true,
      },
      email: {
        title: 'E-mail',
        type: 'string',
        editable: true,
      },
      role: {
        title: 'Role',
        type: 'html',
        editable: true,
      },
      phone: {
        title: 'Phone',
        type: 'string',
        editable: true,
      },
    },
    attr: {
    	class: 'table table-bordered',
    },
    pager: {
    	display: true,
    	perPage: 5
    },
    mode: 'external',
  };


  tableData = new Array();
  source: LocalDataSource;
  roles = new Array();

  portal: string;
  projectId: number;
  project: object;
  user: object;

  selectedMember: object;
  
  userMemberRole: string;  // For authorization level
  authorizedLevel: string;
  
	constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private shared: SharedService,
    private titleService: Title,
  ) {
      this.titleService.setTitle('Project Members | TeamIt');
  }

  ngOnInit(): void {
    this.getMembers();
  }

  getMembers = () => {
    this.portal = this.route.params['_value']['portal'];
    this.projectId = this.route.params['_value']['id'];

    this.api.getMembers(this.portal, this.projectId).subscribe(
      data => {
        this.setVars(data);
        this.getRoleChoices();
      },
      error => {
        console.log(error);
      }
    );
  }

  setVars = (data) => {
    this.project = data.projects;

    for (let member of data.projects.member_set) {
      let member_dict = {
        "id": member['id'],
        "name": member['name'],
        "email": member['email'],
        "role": member['role'],
        "phone": member['contact_number']
      };
      this.tableData.push(member_dict);
    }
    
    this.source = new LocalDataSource(this.tableData); // create the source
    this.user = JSON.parse(sessionStorage.getItem('user'));
    this.userMemberRole = data["member_role"];
    this.setAuthorizationLevel();
  }

  getRoleChoices = () => {
    this.api.getProjectChoices().subscribe(
      data => {
        this.roles = data.MEMBER_ROLES;
      },
      error => {
        console.log(error);
      }
    );
  }

  memberDetails = (event) => {
    for (let member of this.project['member_set']) {
      if (member['id'] == event.data.id) {
        this.selectedMember = member;
      }
    }

    this.shared.scrollToDiv('memberDetailDiv', 1000);
  }

  addMemberEvent = () => {
    if (this.authorizedLevel == 'admin') {
      $('#addMemberModal').modal('show');
    }
    else {
      this.shared.notAuthorizedMsg();
    }
  }

  setAuthorizationLevel = () => {
    let administratorRoles = ['Administrator', 'Project Manager'];

    if (administratorRoles.includes(this.userMemberRole)) {
      this.authorizedLevel = 'admin';
    }
    else {
      this.authorizedLevel = 'non-admin';
    }
  }

  addMember = (form: NgForm) => {
    $('#addMemberModal').modal('hide');
    this.shared.setToast("Sending invitation email.", "green");

    this.api.memberInvite(this.portal, this.projectId, form.value).subscribe(
      response => {
        this.shared.setToast("Invitation email sent.", "green");
      },
      error => {
        console.log(error);
        this.shared.setMsg("danger", error.error, null);
      } 
    )
  }

  memberUpdate = (form: NgForm) => {
    let memberId = this.selectedMember['id'];
    
    this.api.memberUpdate(
      this.portal, this.projectId, memberId, form.value).subscribe(
      response => {
        this.shared.setToast("Member updated!", "green");
        this.getMembers();
      },
      error => {
        console.log(error);
      } 
    )
  }

  messageMember = (recepientID) => {
    let messageTarget = this.getPrivateChatID(this.user['id'], recepientID);
    this.router.navigate([`/messages/PC/${messageTarget}`]);
  }

  getPrivateChatID = (sender, recepient) => {
    let tempArray = [sender, recepient]
    let sortedArray = tempArray.sort((a,b) => a-b);
    let messageTarget = sortedArray[0] +'-' +sortedArray[1];
    return messageTarget;
  }
}
