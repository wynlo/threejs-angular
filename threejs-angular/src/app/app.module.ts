import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { LiftComponent } from './lift/lift.component';
import { CraneComponent } from './crane/crane.component';
import { FrontComponent } from './front/front.component';
import { VesselComponent } from './vessel/vessel.component';

@NgModule({
  declarations: [
    AppComponent,
    LiftComponent,
    CraneComponent,
    FrontComponent,
    VesselComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatSliderModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
