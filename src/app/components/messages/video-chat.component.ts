import { Component, OnInit } from '@angular/core';
import { catchError, tap, switchAll } from 'rxjs/operators';
import { filter, map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { SharedService } from 'src/app/services/shared.service';
import {Title} from "@angular/platform-browser";


declare global {
  interface Window {
      JitsiMeetExternalAPI:any;
  }
};

@Component({
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.css'],
  providers: [
    ApiService, SharedService,
  ]
})
export class VideoChatComponent implements OnInit {
	portal: string;
  user: object;
  roomId: number;
  roomType: string;
  
  myPeerConnection;

	// get video dom elements
  video;
  partnerVideo;
  userStream;
  incomingCall;
  callOptions: object;
  jitsiAPI;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private shared: SharedService,
    private titleService: Title,
  ) {
      this.titleService.setTitle('Video Chat | TeamIt');
  }

  ngOnInit(): void {
    this.roomType = this.route.params['_value']['roomType'];
    this.roomId = Number(this.route.params['_value']['roomId']);
    this.user = JSON.parse(sessionStorage.getItem('user'));
    
    setTimeout(() => {
        if (this.roomType == 'PC') {
          this.setVars();
        }
        else {
          this.setCallOptions(history.state);

          let wsPath = `/ws/messages/`;
          this.shared.wsConnect(wsPath).subscribe(
            response => {
              console.log(response);
            },
            error => {
              console.log(error);
            }
          );

          this.setJitsi();
        }
      }
    , 1000 );
  }

  setJitsi = () => {
    const domain = "meet.jit.si";
    let options={
      roomName: `${this.roomType}-${this.roomId}`,
      parentNode: document.querySelector('#videos'),
    };


    if (this.callOptions["video"] == false) {
      options['configOverwrite'] = {startAudioOnly: true};
    }

    this.jitsiAPI = new window.JitsiMeetExternalAPI(
      domain, options
    );

    if (history.state.outgoing) {
      const payload = {
        "target_type": this.roomType,
        "target": this.roomId,
        "call_options": this.callOptions,
      };
      this.shared.wsEmit("jitsi_offer", payload);
    }
  }

  setVars = () => {
    this.video = document.getElementById('myVideo');
    this.partnerVideo = document.getElementById('partnerVideo');
    this.setCallOptions(history.state);
    
    this.connectSocket();
  }

  setCallOptions = (state) => {
    // Setting Call Options
    if (state.incoming) {
      this.callOptions = state.incoming.payload["call_options"];
    }
    else if(state.outgoing){
      this.callOptions = state.outgoing;
    }
    else {
      this.router.navigate(['/messages']);
    }
  }

  connectSocket = () => {
    let wsPath = `/ws/messages/`;

    this.shared.wsConnect(wsPath).subscribe(
      response => {
        switch (response.type) {
          case 'videochat_answer':
            if (response.payload['caller'] == this.user['id']) {
              console.log("RECEIVED ANSWER", response);
              this.targetAnswered(response);
            }
            break;            
          
          case 'ice_candidate':
            if (response.payload['sender'] != this.user['id']) {
              console.log("RECEIVED CANDIDATE", response);
              this.handleICECandidateMsg(response);
            }
        }
      },
      error => {
        console.log(error);
      }
    );

    this.startCam();
  }


  videoChat = () => {
    if (history.state.incoming) {
      console.log("HISTORY DATA AVAILABLE");
      this.incomingCall = history.state.incoming;
      this.youAnswered(this.incomingCall);
    }
    else if(history.state.outgoing){
      console.log("CALLING USER");
      this.callUser();
    }
    else {
      this.router.navigate(['/messages']);
    }
  }


  startCam = () => {
    // Invite user for a video call
    if (this.myPeerConnection) {
      alert("You can't start a call because you already have one open!");
    } 
    else {
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(this.callOptions)
          .then((stream) => {
            this.userStream = stream;
            this.video.srcObject = stream;

            console.log("STARTING CAM");
            this.videoChat();
          })
          .catch((err0r) => {
            this.handleGetUserMediaError(err0r);
          });
      }
    }
  }


  handleGetUserMediaError = (e) => {
    switch(e.name) {
      case "NotFoundError":
        alert("Unable to open your call because no camera and/or microphone" +
              "were found.");
        break;
      case "SecurityError":
      case "PermissionDeniedError":
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        alert("Error opening your camera and/or microphone: " + e.message);
        break;
    }

    // closeVideoCall();
  }


  callUser = () => {
    this.myPeerConnection = this.createPeerConnection(`${this.roomType}-${this.roomId}`);
    this.userStream.getTracks().forEach(
      track => this.myPeerConnection.addTrack(track, this.userStream));
  }


  youAnswered = (incomingCall) => {
    this.myPeerConnection = this.createPeerConnection(null);
    const desc = new RTCSessionDescription(incomingCall.payload.sdp);

    this.myPeerConnection.setRemoteDescription(desc).then(() => {
      this.userStream.getTracks().forEach(
        track => this.myPeerConnection.addTrack(track, this.userStream));
    }).then(() => {
        return this.myPeerConnection.createAnswer();
    }).then(answer => {
      console.log("ANSWER", answer);
      return this.myPeerConnection.setLocalDescription(answer);
    }).then(() => {
      const payload = {
        "target_type": this.roomType,
        "target": this.roomId,
        "caller": incomingCall.payload.caller,
        "sdp": this.myPeerConnection.localDescription
      };

      console.log("EMITTING ANSWER", payload);
      this.shared.wsEmit("videochat_answer", payload);
    })
  }


  targetAnswered = (answer) => {
    const desc = new RTCSessionDescription(answer.payload.sdp);
    console.log("TARGET ANS", desc);
    this.myPeerConnection.setRemoteDescription(desc).catch(e => console.log(e));
  }


  createPeerConnection = (userID) => {
    const peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.stunprotocol.org"
          },
          {
            urls: "turn:numb.viagenie.ca",
            credential: 'muazkh',
            username: 'webrtc@live.com'
          }
        ]
    });

    peer.onicecandidate = (e) => this.handleICECandidateEvent(e);
    peer.ontrack = (e) => this.handleTrackEvent(e);
    peer.onnegotiationneeded = () => this.handleNegotiationNeededEvent(userID);
    // this.myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    // this.myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    // this.myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    // this.myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
    console.log("PEER CONNECTION CREATED");
    return peer;
  }


  handleICECandidateEvent = (e) => {
    console.log("CANDIDATE EVENT", e);
    if (e.candidate) {
      const payload = {
        "target_type": this.roomType,
        "target": this.roomId,
        "candidate": e.candidate
      };

      this.shared.wsEmit("ice_candidate", payload);
    }
  }

  handleICECandidateMsg = (incoming) => {
    console.log("CANDIDATE MSG", incoming);
    const candidate = new RTCIceCandidate(incoming.payload.candidate);

    this.myPeerConnection.addIceCandidate(candidate).catch(
      e => console.log(e));
  }


  handleTrackEvent = (e) => {
    console.log("HANDLE TRACK STREAM", e.streams[0]);
    this.partnerVideo.srcObject = e.streams[0];
    console.log("PARTNER ", this.partnerVideo)
  }


  handleNegotiationNeededEvent = (userID) => {
    console.log("NEGOTIATE", )
    this.myPeerConnection.createOffer().then(videochat_offer => {
      return this.myPeerConnection.setLocalDescription(videochat_offer);
      }).then(() => {
          const payload = {
            "target_type": this.roomType,
            "target": this.roomId,
            "call_options": this.callOptions,
            // caller: this.socket.id,
            "sdp": this.myPeerConnection.localDescription
          };
          
          this.shared.wsEmit('videochat_offer', payload);
        }).catch(e => console.log(e));
  }
}
