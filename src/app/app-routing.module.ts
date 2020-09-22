import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MembersComponent } from './components/projects/members.component';
import { AddMemberComponent } from './components/projects/add-member.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProjectDetailsComponent } from './components/projects/project-details.component';
import { MilestoneDetailsComponent } from './components/projects/milestone-details.component';
import { TicketsComponent } from './components/projects/tickets.component';
import { MessagesComponent } from './components/messages/messages.component';
import { MobileChatComponent } from './components/messages/mobile-chat.component';
import { VideoChatComponent } from './components/messages/video-chat.component';
import { ProfileComponent } from './components/profile/profile.component';


import { LoginComponent } from './components/auth/login.component';
import { SignupComponent } from './components/auth/signup.component';
import { AuthGuard } from './services/auth-guard.service';
import { ChatGuard } from './services/chat-guard.service';


const routes: Routes = [
	{ path: "login", component: LoginComponent },
	
	{ path: "signup", component: SignupComponent },

	{ path: "profile", component: ProfileComponent },

	{ path: "", component: HomeComponent, canActivate: [AuthGuard] },
	
	{ path: "portals/:portal", component: ProjectsComponent, canActivate: [AuthGuard] },
	
	{ path: "portals/:portal/projects/:id",
	  component: ProjectDetailsComponent, canActivate: [AuthGuard] },
	
	{ path: "portals/:portal/projects/:id/members",
	  component: MembersComponent, canActivate: [AuthGuard] },
	
	{ path: "portals/:portal/projects/:id/confirm-invite/:token", 
	  component: AddMemberComponent, canActivate: [AuthGuard] },

	{ path: "portals/:portal/projects/:id/milestones",
	  component: MilestoneDetailsComponent, canActivate: [AuthGuard] },
	
	{ path: "portals/:portal/projects/:id/milestones/:milestone",
	  component: MilestoneDetailsComponent, canActivate: [AuthGuard] },

	{ path: "portals/:portal/projects/:id/tickets",
	  component: TicketsComponent, canActivate: [AuthGuard] },
	
	{ path: "messages",
	  component: MessagesComponent, canActivate: [AuthGuard] },

	{ path: "messages/:roomType/:roomId",
	  component: MobileChatComponent, canActivate: [ChatGuard] },
	
	{ path: "messages/:roomType/:roomId/video-chat",
	  component: VideoChatComponent, canActivate: [AuthGuard] },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
