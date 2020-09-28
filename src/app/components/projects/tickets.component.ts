import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';
import { LocalDataSource } from 'ng2-smart-table';
import { NgForm } from '@angular/forms';
import { WebSocketService } from 'src/app/services/web-socket-service.service';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css'],
  providers: [ApiService, SharedService, WebSocketService]
})
export class TicketsComponent implements OnInit, OnDestroy {

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
      title: {
        title: 'Title',
        type: 'string',
        editable: true,
      },
      ticket_type: {
        title: 'Type',
        type: 'string',
        editable: true,
      },
      severity: {
        title: 'Severity',
        type: 'string',
        editable: true,
      },
      status: {
        title: 'Status',
        type: 'string',
        editable: true,
      },
      due_date: {
        title: 'Due Date',
        type: 'html',
        editable: true,
        sort: true,
        sortDirection: 'asc',
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
  projectTickets = new Array();
  projectChoices: object;

  // Selected Ticket
  selectedTicket: object;
  selectedTicketComments = new Array();
  ticketResponsible: number;
  
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
      this.titleService.setTitle('Project Tickets | TeamIt');
  }

  ngOnInit(): void {
    this.getTickets();
    this.getTicketChoices();
  }

  ngOnDestroy() {
     this.socket.close();
  }

  getTickets = () => {
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

  getSocketComment = (ticketId) => {
    this.socket.close();
    let wsPath = `/ws/comments/t/${ticketId}/`;

    setTimeout(() => {
      this.socket.connect(wsPath).subscribe(
      response => {
        this.selectedTicketComments.push(response.comment);
      },
      error => {
        console.log(error);
      }
    );
    }, 500);
  }

  setVars = (data) => {
    this.project = data.projects;
    this.projectTickets = data.projects['ticket_set'];

    this.makeTableSource();
    this.userMemberRole = data["member_role"];
    this.setAuthorizationLevel();

    try {
      this.userId = JSON.parse(sessionStorage.getItem('user'))['id'];
    }
    catch(error) { }
    finally { }

    this.route.queryParams.subscribe(params => {
      const selectedTicketId = params['t'];
      if (selectedTicketId != '' && 
          selectedTicketId != undefined &&
          selectedTicketId != null){
        this.ticketDetails(selectedTicketId);
      }
    })
  }

  makeTableSource = () => {
    this.tableData = new Array();
    for (let ticket of this.projectTickets) {
      let ticket_dict = this.getTicketTableDict(ticket);
      this.tableData.push(ticket_dict);
    }
    this.source = new LocalDataSource(this.tableData);
  }

  getTicketTableDict = (ticket: object) => {
    let ticket_dict = {
        "id": ticket['id'],
        "title": ticket['title'],
        "ticket_type": ticket['ticket_type'],
        "severity": ticket['severity'],
        "status": ticket['status'],
        "due_date": ticket['due_date'],
      };
      
    return ticket_dict;
  }

  ticketSelected = (id) => {
    this.router.navigate([], {relativeTo: this.route, queryParams: {t: id}});
  }

  ticketDetails = (id) => {
    for (let ticket of this.projectTickets) {
      if (ticket['id'] == id) {
        this.selectedTicket = ticket;
        this.selectedTicketComments = ticket['ticketcomment_set'];
        
        if (ticket['assigned_to']) {
          this.ticketResponsible = ticket['assigned_to']['id'];
        }
      }
      setTimeout(() => this.shared.scrollToDiv('ticketDetailDiv', 1000), 500);
      this.getSocketComment(id);
    }
  }

  addTicketEvent = () => {
    $('#addTicketModal').modal('show');

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

  addTicket = (addForm: NgForm) => {
    $('#addTicketModal').modal('hide');
    
    this.api.addTicket(this.portal, this.projectId, addForm.value).subscribe(
      response => {
        this.shared.setToast("Ticket created!", "green");

        // Updating ticket table
        this.projectTickets.push(response);
        this.makeTableSource();
      },
      error => {
        console.log(error);
        this.shared.setMsg("danger", error.error, null);
        this.shared.scrollToTop();
      } 
    )
  }

  ticketUpdate = (updateForm: NgForm) => {
    let ticketId = this.selectedTicket['id'];
    
    this.api.ticketUpdate(
      this.portal, this.projectId, ticketId, updateForm.value).subscribe(
      response => {
        this.shared.setToast("Ticket updated!", "green");
        this.selectedTicket = response;

        // Updating ticket table
        let ticket_dict = this.getTicketTableDict(response);
        for (let ticket of this.tableData) {
          if (ticket['id'] == ticket_dict['id']) {
            this.tableData[this.tableData.indexOf(ticket)] = ticket_dict;
            this.source = new LocalDataSource(this.tableData);
          }
        }
      },
      error => {
        console.log(error);
      } 
    )
  }

  ticketComment = (commentForm: NgForm) => {
    const ticketId = commentForm.value['ticketID'];
    const data = {
      "ticket": ticketId,
      "comment": commentForm.value['comment'],
      "project_id": this.projectId,
    }

    try {
      this.socket.sendMessage(data);
    }
    catch(error) {
      this.commentOverHTTP(ticketId, data);
    }
    commentForm.reset();
  }

  commentOverHTTP = (ticketId, comment) => {
    this.api.ticketComment(this.portal, this.projectId, ticketId, comment).subscribe(
      response => {
        this.selectedTicketComments = response;
      },
      error => {
        console.log(error);
      }
    );
  }

  deleteTicket = (ticketId) => {
    let sure = confirm("Are you sure you want to delete this ticket ?");
    if (sure == true) {
      this.api.deleteTicket(this.portal, this.projectId, ticketId).subscribe(
        response => {
          this.shared.setToast("Ticket deleted!", "green");
          this.selectedTicket = undefined;
          this.projectTickets = response;
          this.makeTableSource();
          this.shared.scrollToTop();
        },
        error => {
          console.log(error);
        }
      )
    }
  }

  getTicketChoices = () => {
    this.api.getProjectChoices().subscribe(
      response => {
        this.projectChoices = response;
      },
      error => {
        console.log(error);
      }
    )
  } 
}
