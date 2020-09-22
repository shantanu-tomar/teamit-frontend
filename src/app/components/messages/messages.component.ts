import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { v1 as uuid } from 'uuid';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
  providers: [
    ApiService, SharedService,
  ]
})
export class MessagesComponent implements OnInit {
  // myWebSocket: WebSocketSubject<any> = webSocket('ws://127.0.0.1:8000/ws/messages/tomshop/');
  portal: string;
  user: object;

  desktopScreen: boolean;

  projectChatGroups = new Array();
  userChatGroups = new Array();
  chats: object;
  selectedChat: object;

  roomId: number;
  roomType: string;
  messages = new Array();

  form: FormGroup;
  writeMessage = new FormControl();
  fileb64;
  fileName: string;
  fileType: string;

  showFilepicker: boolean = false;
  attachedFiles = new Array();

  docInput;
  audioInput;
  imageInput;
  videoInput;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private shared: SharedService,
    private formBuilder: FormBuilder,
    private titleService: Title,
  ) {
      this.titleService.setTitle('Messages | TeamIt');
  }

  ngOnInit(): void {
  	this.user = JSON.parse(sessionStorage.getItem('user'));
    this.setVars();

    this.form = this.formBuilder.group({
      image_attach: [''],
      doc_input: [''],
      audio_input: [''],
      video_input: [''],
    });
  
    this.getChats();
  	this.getSocketMessage();
  }

  setVars = () => {
    this.desktopScreen = (window.innerWidth > 768);
    this.docInput = document.getElementById('docAttach')
    this.audioInput = document.getElementById('audioAttach')
    this.videoInput = document.getElementById('videoAttach')
    this.imageInput = document.getElementById('imageAttach')
  }

  getChats = () => {
    this.api.getChats().subscribe(
      data => {
        this.projectChatGroups = data.chat_groups.project_chatgroups;
        this.userChatGroups = data.chat_groups.user_chatgroups;
        this.chats = data.chat_groups;
        
      },
      error => {
        console.log(error);
      }
    );
  }

  getSocketMessage = () => {
  	let wsPath = `/ws/messages/`;

    setTimeout(() => { 
      this.shared.wsConnect(wsPath).subscribe(
    		response => {
    			switch (response.type) {
            case 'message':
              console.log("RCVD MSG ", response);
              this.appendMessage(response.message);

              if (response.message['sender'] != this.user['id']) {
                this.sendDeliveredReceipt(response.message);
              }
              break;

            case 'delivery_receipt':
              console.log("RCVD DEL RECEIPT ", response);
              this.updateMsgStatus(response.payload, "D");
              break

            case 'videochat_offer':
              // Handled by 'app.component.ts'
              break;

            case 'jitsi_offer':
              // Handled by 'app.component.ts'
              break;
          }
    		},
    		error => {
    			console.log(error);
    		}
    	);
    }, 500);
  }

  appendMessage = (message) => {
    let msgTargetType = message.target_type;

    if (msgTargetType == 'PG') {
      for (let group of this.projectChatGroups) {
        if (group['id'] == message['project_chat_group']) {
          group['message_set'].push(message);
        }
      }
    }

    else if (msgTargetType == 'UG') {
      for (let group of this.userChatGroups) {
        if (group['id'] == message['user_chat_group']) {
          group['message_set'].push(message);
        }
      }
    }
  }

  sendMessage = () => {
    const tempID = uuid();  // Temp msg ID on client
    const datetime = new Date();

    let data = {
      "event": "sent_message",
      "payload": {
        "target_type": this.roomType,
        "target": this.roomId,
        "text": this.writeMessage.value,
        "file_type": this.fileType,
        "filename": this.fileName,
        "file": this.fileb64,
        "sender": {
          "id": this.user['id'],
        },
        "temp_id": tempID,
        "created": datetime,
      }
    };

    this.shared.wsSendMessage(data);
    this.form.reset();
    this.selectedChat['message_set'].push(data['payload']);
    // this.shared.divBottomScroll('messagesDiv');
  }

  sendDeliveredReceipt = (message) => {
    let data = {
      "event": "delivery_receipt",
      "payload": {
        "message_id": message['id'],
        "delivered_to": this.user['id']
      }
    };

    this.shared.wsSendMessage(data);
  }


  sendReadReceipt = (message) => {
    let data = {
      "event": "delivery_receipt",
      "payload": {
        "message_id": message['id'],
        "read_by": this.user['id']
      }
    };

    this.shared.wsSendMessage(data);
  }


  updateMsgStatus = (payload, status) => {
    const message = payload['message'];
    const messageId = message['id'];
    const roomType = message['target_type'];
    const clientUUID = message['id_on_client'];

    if (roomType == 'PG') {
      for (let group of this.projectChatGroups) {
        if (group['id'] == message['project_chat_group']) {
          if (status == 'D') {
            for (let msg of group['message_set']) {
              if (msg['temp_id'] == message['id_on_client']) {
                let msgIndex = (group['message_set'].indexOf(msg));
                group['message_set'][msgIndex] = message;
                // group['message_set'].reverse();
              }
            }
          }

          else if (status == 'R') {
            for (let msg of group['message_set']) {
              if (msg['id'] == message['id']) {
                msg['status'] == status;
              }
            }
          }
        }
      }
    }
  }


  selectChat = (chat) => {
    if (this.desktopScreen == true) {
      this.selectedChat = chat;
      this.messages = chat['message_set'];
      this.roomType = chat['room_type'];
      this.roomId = chat['id'];
    }

    else if (this.desktopScreen == false){
      const roomType = chat['room_type'];
      const roomId = chat['id'];
      
      this.router.navigate([`/messages/${roomType}/${roomId}`], 
      {state: {chat: chat}});

    }
  }


  getLastChatMsg = (chat) => {
    let lastIndex = (chat['message_set']).length - 1;
    
    if (lastIndex >= 0) {
      let lastMsg = chat['message_set'][lastIndex];
      return lastMsg;
    }
  }


  fileUpload = (event) => {
    if (event.target.files.length > 0) {
      let file = event.target.files[0];
      let filesize = Number(((file.size/1024)/1024).toFixed(4)); // MB

      if (filesize <= 20) {
        let fileReader = new FileReader();
        fileReader.readAsDataURL(file);
      
        fileReader.onloadend = (e) => {
          this.fileb64 = fileReader.result;
          this.fileName = file.name;
          this.fileType = (file.type).split('/')[0];
        }
      }
    }
  }


  goToVideoChatRoom = (options) => {
    this.router.navigate([`/messages/${this.roomType}/${this.roomId}/video-chat`], 
      {state: {outgoing: options}});
  }


  imageAttachBtn = () => {
    document.getElementById('imageAttach').click();
    $('#fileTypePickerModal').modal('hide');
  }

  docAttachBtn = () => {
    document.getElementById('docAttach').click();
    $('#fileTypePickerModal').modal('hide');
  }

  audioAttachBtn = () => {
    document.getElementById('audioAttach').click();
    $('#fileTypePickerModal').modal('hide');
  }

  videoAttachBtn = () => {
    document.getElementById('videoAttach').click();
    $('#fileTypePickerModal').modal('hide');
  }

  
}
