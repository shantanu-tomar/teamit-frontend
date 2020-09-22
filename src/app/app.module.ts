import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpClientModule, HttpClientXsrfModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { MembersComponent } from './components/projects/members.component';
import { AddMemberComponent } from './components/projects/add-member.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProjectDetailsComponent } from './components/projects/project-details.component';
import { MilestoneDetailsComponent } from './components/projects/milestone-details.component';
import { TicketsComponent } from './components/projects/tickets.component';
import { MessagesComponent } from './components/messages/messages.component';
import { MobileChatComponent } from './components/messages/mobile-chat.component';
// import { PrivateMessageComponent } from './components/messages/private-message.component';
import { VideoChatComponent } from './components/messages/video-chat.component';


import { LoginComponent } from './components/auth/login.component';
import { SignupComponent } from './components/auth/signup.component';


// 3rd Party Modules
import { ChartsModule } from 'ng2-charts';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';


// 3rd Party components

// Services
import { WebSocketService } from './services/web-socket-service.service';
import { ApiService } from './services/api.service';
import { SharedService } from './services/shared.service';
import { AuthService } from './services/auth.service';
import { AuthInterceptor } from './services/auth.interceptor';
import { AuthGuard } from "./services/auth-guard.service";
import { ChatGuard } from './services/chat-guard.service';
import { ProfileComponent } from './components/profile/profile.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProjectsComponent,
    ProjectDetailsComponent,
    MembersComponent,
    MilestoneDetailsComponent,
    TicketsComponent,
    AddMemberComponent,
    LoginComponent,
    SignupComponent,
    MessagesComponent,
    VideoChatComponent,
    MobileChatComponent,
    ProfileComponent,
    // PrivateMessageComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    HttpClientXsrfModule,
    ChartsModule,
    Ng2SmartTableModule,
    CKEditorModule,
    FormsModule,
    ReactiveFormsModule,

  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    
    WebSocketService,
    ApiService,
    SharedService,
    AuthService,
    AuthGuard,
    ChatGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
