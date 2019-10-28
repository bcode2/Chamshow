import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AgmCoreModule } from '@agm/core';
import { AgmJsMarkerClustererModule } from '@agm/js-marker-clusterer';

import { AppComponent } from './app.component';
import { RoadshowService } from '../api/roadshow.service';
import { MainComponent } from './main/main.component';
import { ServiceComponent } from './service/service.component';
import { RutasComponent } from './rutas/rutas.component';

const routes: Routes = [
  { path: '', redirectTo: 'main', pathMatch: 'full' },
  { path: 'main', component: MainComponent , pathMatch: 'full' },
  { path: 'main/:sucursal/:cliente', component: MainComponent, pathMatch: 'full' },
  { path: 'service', component: ServiceComponent },
  { path: 'rutas', component: RutasComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    ServiceComponent,
    RutasComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    RouterModule.forRoot(routes),
    AgmCoreModule.forRoot({
       apiKey: 'AIzaSyCk_QmOe4BTCWUkccQODdkejeJAZEfSL3E',
       libraries: []
    }),
    AgmJsMarkerClustererModule
  ],
  providers: [RoadshowService],
  bootstrap: [AppComponent]
})
export class AppModule { }
