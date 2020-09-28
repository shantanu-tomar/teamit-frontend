import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';
import {Title} from "@angular/platform-browser";
import { NgForm } from '@angular/forms';


@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  providers: [
    ApiService, SharedService,
  ]
})
export class ProjectsComponent implements OnInit {
  settings = {
    actions: {
      delete: false
    },
    edit: {
      editButtonContent: '<i class="btn-sm btn-outline-info w-100">Details</i>',
    },
    add: {
      addButtonContent: '<i class="btn btn-info w-100">Add</i>',
    },
    columns: {
      title: {
        title: 'Project Name',
        type: 'string',
      },
      owner: {
        title: 'Owner',
        type: 'string',
      },
      status: {
        title: 'Status',
        type: 'string',
      },
      tickets: {
        title: 'Tickets/Bugs',
        type: 'number',
      },
      start_date: {
        title: 'Start Date',
        type: 'string',
        sort: true,
        sortDirection: 'desc',
      },
      end_date: {
        title: 'End Date',
        type: 'string',
      },
      completed: {
        title: 'Completed',
        type: 'string',
      },
    },
    attr: {
      class: 'table table-bordered',
    },
    pager: {
      display: true,
      perPage: 10
    },
    mode: 'external',
  };

  portal: string;
  userIsOwner: boolean = false;
  projects = new Array();
  projectChoices;

  tableData = new Array();
  source: LocalDataSource;
  showProjectForm: boolean = false;


  constructor(
    private router: Router,
    private api: ApiService,
    private shared: SharedService,
    private route: ActivatedRoute,
    private titleService: Title,
  ) {
      this.titleService.setTitle('Projects | TeamIt');
  }

  ngOnInit(): void {
    this.getProjects();

    // subscribe to queryparams
    this.route.queryParams.subscribe(params => {
      const action = params['action'];
      if (action == 'add') {
        this.shared.scrollToDiv('addProjectDiv', 1000);
        this.getProjectChoices();
        this.showProjectForm = true;
      }
    });
  }

  getProjects = () => {
    this.portal = this.route.params['_value']['portal'];

    this.api.getProjects(this.portal).subscribe(
      data => {
        this.projects = data.projects;
        this.userIsOwner = data.portal_owner;
        this.setVariables(this.projects);
      },
      error => {
        console.log(error);
      }
    )
  }

  setVariables = (projects) => {
    this.source = new LocalDataSource(); // empty existing source (if any)
    
    if (projects.length > 0 ) {
      for (let project of projects){
        let tempData = {
          "id": project["id"],
          "title": project["title"],
          "owner": project["owner"]["name"]? 
                   project["owner"]["name"]: project["owner"]["email"],
          "status": project["status"],
          "tickets": project["ticket_set"]? (project["ticket_set"]).length: 'null',
          "start_date": project["start_date"],
          "end_date": project["end_date"]? project["end_date"]: 'null',
          "completed": `${project["completed"]}`
        };

        this.tableData.push(tempData);
        this.source = new LocalDataSource(this.tableData); // create the source
      }
    }

  }

  projectDetails = (event: any) => {
    let projectId = event.data.id;

    this.router.navigate([`portals/${this.portal}/projects/${projectId}`]);
  }

  addProjectEvent = () => {
    if (this.userIsOwner) {
      this.router.navigate([], {relativeTo: this.route, queryParams: {action: 'add'}});
      this.getProjectChoices();
      this.showProjectForm = true;
    }
    else {
      this.shared.setMsg("danger", "You, not being an owner of this portal, cannot add a project.", null);
    }
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

  addProject = (addProjectForm: NgForm) => {
    let data = addProjectForm.value;
    data['portal'] = this.portal;

    this.api.createProject(this.portal, data).subscribe(
      response => {
        this.shared.setToast("Project created successfully!", "green");
        this.projects.push(response.project);
        this.setVariables(this.projects);
      },
      error => {
        console.log(error);
      }
    );
  }

}
