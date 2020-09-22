import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { Label, Color, SingleDataSet } from 'ng2-charts';
import * as InlineEditor from '@ckeditor/ckeditor5-build-inline';
import { NgForm } from '@angular/forms';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css'],
  providers: [ApiService, SharedService]
})
export class ProjectDetailsComponent implements OnInit {
  // Editor Variables
  Editor = InlineEditor;
  editorData: string;
  editorFocused: boolean = false;
  descChanged: boolean = false;

  portal: string;
  project: object;
  projectStatus: string;
  memberRole: string;  // For authorization level
  authorizedLevel: string;
  projectChoices: object;
  dueWorkItems: object;
  milestoneStatus: object;
  todayDate = new Date();
  
  doughnutFilter = 'type';

  // Milestones
  public milestoneChartOptions: ChartOptions = {
    responsive: false,
    maintainAspectRatio: false,
    legend: {
      position: "right"
    },
  };

  public milestoneChartLabels: Label[] = [];
  public milestoneChartData = [];
  public milestoneChartType: ChartType = 'doughnut';



  // DOUGHNUT CHART
  public doughnutChartOptions: ChartOptions = {
    responsive: false,
    maintainAspectRatio: false,
    legend: {
      position: "right"
    },
  };

  public doughnutTypeLabels: Label[] = [];
  public doughnutTypeData = [];
  public doughnutStatusLabels: Label[] = [];
  public doughnutStatusData = [];
  public doughnutChartType: ChartType = 'doughnut';


  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private api: ApiService,
      private shared: SharedService,
      private titleService: Title,
  ) {
      this.titleService.setTitle('Project Details | TeamIt');
  }

  ngOnInit(): void {
    this.getProjectDetails();
    setTimeout(() => this.getProjectChoices(), 2000);
  }

  getProjectDetails = () => {
    this.portal = this.route.params['_value']['portal'];
    let projectId = this.route.params['_value']['id'];
    
    this.api.getProjectDetails(this.portal, projectId).subscribe(
      data => {
        this.project = data.projects;
        this.memberRole = data["member_role"];

        this.setVars(this.project);
        this.setAuthorizationLevel();

      },
      error => {
        console.log(error);
      }
    )
  }

  setVars = (data) => {
    this.projectStatus = data["status"];
    
    if (data['description']) {
      this.editorData = data["description"];
    }
    else {
      this.editorData = `An overview helps everyone get a crux of the project.<br/>
                            <b>Enter Description now</b>`;
    }

    // Set dueWorkItems
    if (data['ticket_set'].length > 0) {
      this.dueWorkItems = {};
      this.dueWorkItems["tickets"] = data["ticket_set"];
    }

    // Set Doughnut Chart
    let ticketTypes = {};
    let ticketStatuses = {};

    for (let ticket of data["ticket_set"]) {
      
      // recording ticket-count by type
      let ticketType = ticket["ticket_type"];
      let ticketStatus = ticket["status"];

      if (ticketTypes[ticketType] == null) {
        ticketTypes[ticketType] = 1;
      }
      else { ticketTypes[ticketType] += 1; }

      if (ticketStatuses[ticketStatus] == null) {
        ticketStatuses[ticketStatus] = 1;
      }
      else { ticketStatuses[ticketStatus] += 1; }

    }
    

    this.doughnutTypeLabels = Object.keys(ticketTypes);
    this.doughnutTypeData = Object.values(ticketTypes);
    this.doughnutStatusLabels = Object.keys(ticketStatuses);
    this.doughnutStatusData = Object.values(ticketStatuses);


    // Set Milestone Chart
    let milestones = {
      "Completed": 0,
      "Open": 0
    };
    this.milestoneStatus = milestones;

    if (data["milestone_set"].length > 0) {
      for (let milestone of data["milestone_set"]) {
        
        // recording milestone-count by status
        let milestoneCompleted: boolean = milestone["completed"];

        if (milestoneCompleted) {
          milestones["Completed"] += 1;
        }
        else { milestones["Open"] += 1; }

      }
      

      this.milestoneChartLabels = Object.keys(milestones);
      this.milestoneChartData = Object.values(milestones);
    }
  }

  saveProjDesc = (form: NgForm) => {
    let desc = form.value["descInput"];

    if (desc != '') {
      let data = {
        "description": desc
      };
      
      this.api.partialUpdateProject(this.portal, this.project["id"], data).subscribe(
        response => {
          this.shared.setToast("Project description updated!", "green");
        },
        error => {
          console.log(error);
        }
      )
      
    }
  }

  editorBlurred = () => {
    setTimeout(() => this.editorFocused = false, 500)
  }

  getProjectChoices = () => {
    this.api.getProjectChoices().subscribe(
      data => {
        this.projectChoices = data;
      },
      error => {
        console.log(error);
      }
    );
  }

  setAuthorizationLevel = () => {
    let administratorRoles = ['Administrator', 'Project Manager'];

    if (administratorRoles.includes(this.memberRole)) {
      this.authorizedLevel = 'admin';
    }
    else {
      this.authorizedLevel = 'non-admin';
    }
  }

  changeProjectStatus = (value) => {
    let projectId = this.project['id'];
    // let promptPswd = prompt("Enter your password to change this setting: ");
    let data = {
      "status": value
    };
    
    
    this.api.partialUpdateProject(this.portal, projectId, data).subscribe(
      response => {
        this.shared.setToast("Project status updated!", "green");
      },
      error => {
        console.log(error);
      }
    );
  }

  ticketDetails = (ticketId) => {
    this.router.navigate(['tickets'], {queryParams: {t: ticketId}, relativeTo: this.route});
  }
}
