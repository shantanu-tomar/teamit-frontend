import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';
import { LocalDataSource } from 'ng2-smart-table';
import { NgForm } from '@angular/forms';
import { WebSocketService } from 'src/app/services/web-socket-service.service';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-milestone-details',
  templateUrl: './milestone-details.component.html',
  styleUrls: ['./milestone-details.component.css'],
  providers: [ApiService, SharedService, WebSocketService]
})
export class MilestoneDetailsComponent implements OnInit, OnDestroy{

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
      milestone: {
        title: 'Milestone',
        type: 'string',
        editable: true,
      },
      responsible: {
        title: 'Responsible',
        type: 'string',
        editable: true,
      },
      start_date: {
        title: 'Start Date',
        type: 'html',
        editable: true,
      },
      due_date: {
        title: 'Due Date',
        type: 'string',
        editable: true,
      },
      completed: {
        title: 'Completed ?',
        type: 'string',
        editable: true,
        sort: true,
        sortDirection: 'asc',
      },
      completed_on: {
        title: 'Completed On',
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

  portal: string;
  projectId: number;
  project: object;
  projectMilestones = new Array();

  // Selected Milestone
  selectedMilestone: object;
  selectedMilestoneComments = new Array();
  milestoneResponsible: string;
  
  userMemberRole: string;  // For authorization level
  authorizedLevel: string;
  userId: number;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private shared: SharedService,
    private socket: WebSocketService,
    private titleService: Title,
  ) {
      this.titleService.setTitle('Project Milestones | TeamIt');
  }

  ngOnInit(): void {
    this.getMilestones();
  }

  ngOnDestroy() {
     this.socket.close();
  }

  getMilestones = () => {
    this.portal = this.route.params['_value']['portal'];
    this.projectId = this.route.params['_value']['id'];

    this.api.getProjectDetails(this.portal, this.projectId).subscribe(
      data => {
        this.setVars(data);
      },
      error => {
        console.log(error);
      }
    );
  }


  getSocketComment = (milestoneId) => {
    this.socket.close();
    let wsPath = `/ws/comments/m/${milestoneId}/`;

    this.socket.connect(wsPath).subscribe(
      response => {
        this.selectedMilestoneComments.push(response.comment);
      },
      error => {
        console.log(error);
      }
    );
  }


  setVars = (data) => {
    this.project = data.projects;
    this.projectMilestones = data.projects['milestone_set'];

    this.makeTableSource();
    this.userMemberRole = data["member_role"];
    this.setAuthorizationLevel();

    try {
      this.userId = JSON.parse(sessionStorage.getItem('user'))['id'];
    }
    catch(error) { }
    finally { }

    this.route.queryParams.subscribe(params => {
      const selectedMilestoneId = params['m'];
      if (selectedMilestoneId != '' && 
          selectedMilestoneId != undefined &&
          selectedMilestoneId != null){
        this.milestoneDetails(selectedMilestoneId);
      }
    })

  }

  makeTableSource = () => {
    this.tableData = new Array();
    for (let milestone of this.projectMilestones) {
      let milestone_dict = this.getMilestoneTableDict(milestone);
      this.tableData.push(milestone_dict);
    }
    this.source = new LocalDataSource(this.tableData);
  }

  getMilestoneTableDict = (milestone: object) => {
    let milestone_dict = {
        "id": milestone['id'],
        "milestone": milestone['milestone'],
        "responsible": milestone['responsible']? milestone['responsible']['name']: 'null',
        "start_date": milestone['start_date'],
        "due_date": milestone['due_date'],
        "completed": milestone['completed'],
        "completed_on": milestone['completed_on'],
      };
      
    return milestone_dict;
  }


  milestoneSelected = (id) => {
    this.router.navigate([], {relativeTo: this.route, queryParams: {m: id}});
  }


  milestoneDetails = (id) => {
    for (let milestone of this.projectMilestones) {
      if (milestone['id'] == id) {
        this.selectedMilestone = milestone;
        this.selectedMilestoneComments = milestone['milestonecomment_set'];
        
        if (milestone['responsible']) {
          this.milestoneResponsible = milestone['responsible']['id'];
        }
        else {
          this.milestoneResponsible = milestone['responsible'];
        }
        setTimeout(() => this.shared.scrollToDiv('milestoneDetailDiv', 1000), 500);
        this.getSocketComment(id);
        break
      }
    }
  }

  addMilestoneEvent = () => {
    if (this.authorizedLevel == 'admin') {
      $('#addMilestoneModal').modal('show');
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

  addMilestone = (addForm: NgForm) => {
    $('#addMilestoneModal').modal('hide');
    
    this.api.addMilestone(this.portal, this.projectId, addForm.value).subscribe(
      response => {
        this.shared.setToast("Milestone created!", "green");

        // Updating milestone table
        this.projectMilestones.push(response);
        this.makeTableSource();
      },
      error => {
        console.log(error);
        this.shared.setMsg("danger", error.error, null);
        this.shared.scrollToTop();
      } 
    )
  }

  milestoneUpdate = (updateForm: NgForm) => {
    let milestoneId = this.selectedMilestone['id'];
    
    this.api.milestoneUpdate(
      this.portal, this.projectId, milestoneId, updateForm.value).subscribe(
      response => {
        this.shared.setToast("Milestone updated!", "green");

        // Updating milestone table
        let milestone_dict = this.getMilestoneTableDict(response);
        for (let milestone of this.tableData) {
          if (milestone['id'] == milestone_dict['id']) {
            this.tableData[this.tableData.indexOf(milestone)] = milestone_dict;
            this.source = new LocalDataSource(this.tableData);
          }
        }
      },
      error => {
        console.log(error);
      } 
    )
  }

  milestoneComment = (commentForm: NgForm) => {
    const milestoneId = commentForm.value['milestoneID'];
    const data = {
      "milestone": milestoneId,
      "comment": commentForm.value['comment'],
      "project_id": this.projectId,
    }

      try {
      this.socket.sendMessage(data);
    }
    catch(error) {
      this.commentOverHTTP(milestoneId, data);
    }
    commentForm.reset();
  }

  commentOverHTTP = (milestoneId, comment) => {
    this.api.milestoneComment(this.portal, this.projectId, milestoneId, comment).subscribe(
      response => {
        this.selectedMilestoneComments = response;
      },
      error => {
        console.log(error);
      }
    );
  }


  deleteMilestone = (milestoneId) => {
    let sure = confirm("Are you sure you wish to delete this milestone ?");
    if (sure == true) {
      this.api.deleteMilestone(this.portal, this.projectId, milestoneId).subscribe(
        response => {
          this.shared.setToast("Milestone deleted!", "green");
          this.selectedMilestone = undefined;
          this.projectMilestones = response;
          this.makeTableSource();
        },
        error => {
          console.log(error);
        }
      )
    }
  }

}
