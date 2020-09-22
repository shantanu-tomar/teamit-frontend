import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[chatHistory]',
})
export class MobileChatDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}