import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { v1 as uuid } from 'uuid';


@Component({
  selector: 'app-mobile-chat',
  templateUrl: './mobile-chat.component.html',
  styleUrls: ['./messages.component.css'],
    providers: [
      ApiService, SharedService,
  ]

})
export class MobileChatComponent implements OnInit {

  portal: string;
  user: object;
	socketConnected: boolean;

  roomId: string;
  roomType: string;
  chat: object;
  
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
              
  ) { }

  ngOnInit(): void {
    this.setVars();

    this.form = this.formBuilder.group({
      image_attach: [''],
      doc_input: [''],
      audio_input: [''],
      video_input: [''],
      writeMessage: '',
    });
  
    // this.getChat();
    this.getSocketMessage();
  }

  setVars = () => {
  	this.user = JSON.parse(sessionStorage.getItem('user'));
  	this.roomType = this.route.params['_value']['roomType'];
    this.roomId = this.route.params['_value']['roomId'];

    // retrieving chat from history state
    // nevertheless to be failproof, we will make an http request for chat later 
    try {
    	this.chat = history.state.chat;
    }
    catch(error) {
    	console.log(error);
    }
    finally{
    	this.getChat();
    }

    this.docInput = document.getElementById('docAttach');
    this.audioInput = document.getElementById('audioAttach');
    this.videoInput = document.getElementById('videoAttach');
    this.imageInput = document.getElementById('imageAttach');
  }

  getChat = () => {
  	this.api.getChat(this.roomType, this.roomId).subscribe(
      data => {
      	this.chat = data.chat;
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
    			this.socketConnected = true;

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
    			this.socketConnected = false;

    			setTimeout(() => this.getSocketMessage(), 5000);
    		}
    	);
      }, 500);
  }

  appendMessage = (message) => {
    if (this.validateIncomingMsg(message)) {
      this.chat['message_set'].push(message);
    }
  }

  sendMessage = () => {
  	if (!this.socketConnected){
  		this.shared.setToast("You're offline !", "red");
  		return;
  	}

    const tempID = uuid();  // Temp msg ID on client
    const datetime = new Date();

    let message = {
      "target_type": this.roomType,
      "target": this.roomId,
      "text": this.writeMessage.value,
      "file": {
        "type": this.fileType,
        "data": this.fileb64,
        "name": this.fileName
      },
      "sender": {
        "id": this.user['id'],
      },
      "temp_id": tempID,
      "created": datetime,
    }

    let data = {
      "event": "sent_message",
      "payload": message,
    };

    this.form.reset();
    
    this.chat['message_set'].push(data['payload']);
    this.shared.wsSendMessage(data);
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

    if (this.validateIncomingMsg(message)) {
      if (status == 'D') {
        for (let msg of this.chat['message_set']) {
          if (msg['temp_id'] == message['id_on_client']) {
            let msgIndex = (this.chat['message_set'].indexOf(msg));
            this.chat['message_set'][msgIndex] = message;
            // group['message_set'].reverse();
          }
        }
      }

      else if (status == 'R') {
        for (let msg of this.chat['message_set']) {
          if (msg['id'] == message['id']) {
            msg['status'] == status;
          }
        }
      }
    }
  }


  validateIncomingMsg = (message) => {
    if (this.roomType == 'PG') {
      if (Number(this.roomId) == message['project_chat_group']) {
        return true;
      }
    }

    else if (this.roomType == 'UG') {
      if (Number(this.roomId) == message['user_chat_group']) {
        return true;
      }
    }

    else if (this.roomType == 'PC' && message['target_type'] == 'PC'){
      // let messageTarget = `${message['sender']}-${message['recepient']}`;
      const sender = message['sender'];
      const recepient = message['recepient'];
      const messageTarget = this.getPrivateChatID(sender, recepient);

      if(messageTarget == this.roomId) {
        return true;
      }
    }

    return false;
  }


  getPrivateChatID = (sender, recepient) => {
    let tempArray = [sender, recepient]
    let sortedArray = tempArray.sort((a,b) => a-b);
    let messageTarget = sortedArray[0] +'-' +sortedArray[1];
    return messageTarget;
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
          this.fileType = file.type;
          console.log(this.fileType);
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
  }

  docAttachBtn = () => {
    document.getElementById('docAttach').click();
  }

  audioAttachBtn = () => {
    document.getElementById('audioAttach').click();
  }

  videoAttachBtn = () => {
    document.getElementById('videoAttach').click();
  }

  
}
