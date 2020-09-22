import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  providers: [
    ApiService,
  ]
})
export class ProjectsComponent implements OnInit {
  settings = {
    actions: {
      add: false,
      delete: false
    },
    edit: {
      editButtonContent: '<i class="btn-sm btn-outline-info w-100">Details</i>',
    },
    columns: {
      // id: {
      //   title: 'ID',
      //   type: 'text',
      // },
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
  projects = new Array();


  tableData = new Array();
  source: LocalDataSource;

  constructor(
    private router: Router,
    private api: ApiService,
    private route: ActivatedRoute,
    private titleService: Title,
  ) {
      this.titleService.setTitle('Projects | TeamIt');
  }

  ngOnInit(): void {
    this.getProjects();
  }

  getProjects = () => {
    this.portal = this.route.params['_value']['portal'];

    this.api.getProjects(this.portal).subscribe(
      data => {
        this.projects = data.projects;
        this.setVariables(data);
      },
      error => {
        console.log(error);
      }
    )
  }

  setVariables = (data) => {
    if (this.projects.length > 0 ) {
      for (let project of this.projects){
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

}
