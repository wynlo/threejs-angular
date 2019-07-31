import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FrontComponent } from './front/front.component';
import { LiftComponent } from './lift/lift.component';
import { CraneComponent } from './crane/crane.component';
import { VesselComponent } from './vessel/vessel.component';

const appRoutes: Routes =
  [
    { path: '', redirectTo: '/front', pathMatch: 'full' },
    { path: 'front', component: FrontComponent },
    { path: 'lift', component: LiftComponent },
    { path: 'crane', component: CraneComponent },
    { path: 'vessel', component: VesselComponent }
  ]


@NgModule({
  imports: [RouterModule.forRoot(
    appRoutes,
    { enableTracing: true }
  )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
