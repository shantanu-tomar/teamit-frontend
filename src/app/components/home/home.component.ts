import { Component, OnInit } from '@angular/core';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { MultiDataSet, Label, Color } from 'ng2-charts';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [ApiService],
})
export class HomeComponent implements OnInit {

	// DOUGHNUT CHART
  doughnutFilter = 'type';

  public doughnutChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    legend: {
      position: "right"
    },
  };

  public doughnutTypeLabels: Label[] = [];
  public doughnutTypeData = [];
  public doughnutStatusLabels: Label[] = [];
  public doughnutStatusData = [];
  public doughnutChartType: ChartType = 'doughnut';

  user;
  myPortals = new Array();
  myProjects = new Array();
  myDueTickets = new Array();
  dueMilestones = new Array();
  
  constructor(
    private api: ApiService,
    private router: Router,
    private titleService: Title,
  ) {
      this.titleService.setTitle('Home | TeamIt');
  }

  ngOnInit(): void {
    this.getHomeVars();
  }

  getHomeVars = () => {
    this.api.getHome().subscribe(
      data => {
        this.user = JSON.parse(sessionStorage.getItem('user'));
        this.myPortals = data.portals;
        this.myProjects = data.projects;
        this.myDueTickets = data.due_tickets;
        this.dueMilestones = data.due_milestones;

        this.setChartData();
      },
      error => {
        console.log(error);

      }
    );
  }

  setChartData = () => {
    // Doughnut Chart
    // Set Doughnut Chart
    let ticketTypes = {};
    let ticketStatuses = {};

    for (let ticket of this.myDueTickets) {
      
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


  }

  portalProjects = (name) => {
    this.router.navigate([`/portals/${name}`]);
  }

  milestoneDetails = (stone) => {
    this.router.navigate([
      `portals/${stone['project']['portal']['name']}/projects/${stone['project']['id']}/milestones`]
      , {queryParams: {m: stone['id']}});
  }
}
