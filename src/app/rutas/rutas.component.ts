import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { RoadshowService } from '../../api/roadshow.service';
import { MouseEvent as AGMMouseEvent } from '@agm/core';
import { timer } from 'rxjs';
import * as moment from 'moment';

//Imports para el datepicker
import { CustomDatepickerI18n } from '../../injectables/customDatepickerI18n.service';
import { I18n } from '../../injectables/i18n.service';
import { NgbDatepickerI18n, NgbCalendar, NgbDate, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgbDatepickerConfig, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateFRParserFormatter } from "../../injectables/NgbDateFRParserFormatter.service";

//Imports para animations
import { transition, trigger, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-rutas',
  templateUrl: './rutas.component.html',
  styleUrls: ['../main/main.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate(350)),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RutasComponent implements OnInit {

  clientes = [];
  clientesSolapados = [];
  clientesSolapadosView = [];
  posiciones = [];
  trackingGPS = [];
  trackingGPSView = [];
  lotes = [];
  rutasCant = [];

  resumen;
  loadingResumen = false;
  loteSeleccionado;
  noHayLotes = false;

  title = 'Roadshow';
  cameraLatitude = -33.2266994;
  cameraLongitude = -60.9161475;
  zoom = 7;
  radio = 1;
  draggable = false;

  posCliSelect;
  location;
  direc = "";
  geocodeMode = false;

  Object = Object;
  infoWindowActiva;
  showLoader = true;
  showRutas = false;
  showClientes = false;

  //Modal
  showModalLoading = true;
  showModalClose = false;
  showModalAceptar = false;
  showModalCancelar = false;
  modalText;
  modalTitle;
  showOk = false;
  showError = false;
  showInfo = false;

  posSucursal = 0;
  sucursal = "Buenos Aires";
  sucursales = [ "sparkling", "rosario", "cordoba", "santafe", "laplata", "campana" ];
  sucursalesN = [ "Buenos Aires", "Rosario", "Córdoba", "Santa Fe", "La Plata", "Campana" ];

  fecha = {
    "year": 2019,
    "month": 1,
    "day": 30
  }
  interval;

  //Para datepicker
  isDisabled = (date: NgbDate, current: {month: number}) => date.month !== current.month;
  isWeekend = (date: NgbDate) =>  this.calendar.getWeekday(date) >= 6;

  constructor(private roadshowService: RoadshowService,
              private calendar: NgbCalendar,
              private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.fecha.year = moment().year();
    this.fecha.month = moment().month() + 1;
    this.fecha.day = moment().date();

    this.onClickRutas();
    this.getLotes();
  }

  getLotes(){
    this.showLoader = true;
    this.lotes = [];
    this.cdr.detectChanges();

    var suc = this.getSucursalSeleccionada();
    var fecha = this.getFechaSeleccionada();
    this.roadshowService.getLotes(suc, fecha).subscribe(res => {
      if (res) {
        setTimeout(() => {
          this.lotes = res;
          this.noHayLotes = this.lotes.length == 0
          this.showLoader = false;
          this.cdr.detectChanges();
          this.roadshowService.getTrackingGPS().subscribe(res => {
            if(res){
              this.trackingGPS = res;
              this.trackingGPSView = res;
            }

            this.startTimer();
            this.cdr.detectChanges();
          });
        }, 200);
      }
    });
  }

  startTimer() {
    this.interval = setInterval(() => {
      this.roadshowService.getTrackingGPS().subscribe(res => {
        if (res){
          console.log(res);
          this.trackingGPS = res;
          if (!this.loteSeleccionado)
            this.trackingGPSView = res;
          else
            this.trackingGPSView = this.trackingGPS.filter(pos => pos.codigo == this.loteSeleccionado.patente);

          this.cdr.detectChanges();
        }
      });
    }, 60000);
  }

  //Despliega el menú de rutas y cierra el de clientes
  onClickRutas(){
    this.showClientes = false;
    setTimeout(() => {

      this.showRutas = true;
      this.cdr.detectChanges();
    }, 200);
  }

  //Despliega el menú de clientes y cierra el de rutas
  onClickClientes(){
    this.showRutas = false;
    setTimeout(() => {
      this.showClientes = true;
      this.cdr.detectChanges();
    }, 200);
  }

  onClickCliente(cliente, i){
    console.log(this.infoWindowActiva);
    if (this.infoWindowActiva)
      this.infoWindowActiva.close();

    this.posCliSelect = i;
    console.log(i);

    this.cameraLatitude = cliente.latitud;
    this.cameraLongitude = cliente.longitud;
    this.zoom = 16;
    cliente.abrir = true;
    this.cdr.detectChanges();
  }

  onClickMarker(infoWindow, cliente){
    console.log(this.infoWindowActiva);
    if (this.infoWindowActiva)
      this.infoWindowActiva.close();

    this.infoWindowActiva = infoWindow;

    this.cdr.detectChanges();
  }

  onClickLote(lote){
    if (lote.patente == 'Sin Patente'){
      this.showModal("Recorrido", "El lote elegido no tiene patente", false, false, true, false, "Info");
      return
    }
    if(lote == this.loteSeleccionado){
      this.trackingGPSView = this.trackingGPS;
      this.loteSeleccionado= null;
      this.clientes = [];
      this.posiciones = [];
      this.cdr.detectChanges();
      return;
    }

    this.loadingResumen = true;
    this.loteSeleccionado = lote;
    this.showModal("Recorrido", "Obteniendo recorrido de la patente " + lote.patente, false, false, false, true, "No");
    var sucursal = this.getSucursalSeleccionada();
    var fecha = this.getFechaSeleccionada();
    this.roadshowService.getRecorridoCamion(sucursal, fecha, lote.patente).subscribe(
      res => {
        if (res){
          this.clientes = res.filter(punto => punto.tipo.includes("cliente"));
          this.posiciones = res .filter(punto => punto.tipo == "camion")
                                .sort((a, b) => a.time_stamp.localeCompare(b.time_stamp));
          this.trackingGPSView = this.trackingGPS.filter(pos => pos.codigo == lote.patente);

          if (this.posiciones.length > 0){
            this.zoom = 13;
            var midPoint = this.posiciones[Math.round(this.posiciones.length / 2)];
            console.log(this.posiciones);
            this.cameraLatitude = midPoint.latitud;
            this.cameraLongitude = midPoint.longitud;
          }
          this.hideModal();
          this.cdr.detectChanges();

          this.roadshowService.getResumenCamion(fecha, lote.patente).subscribe(res =>{
            if (res){
              this.loadingResumen = false;
              this.resumen = res;
              this.cdr.detectChanges();
            }
          },
          err => {
            console.log(err);
          });
        }
      },
      err => {
        console.log(err);
        this.hideModal();
        this.cdr.detectChanges();
    });
  }

  onClickSucursal(pos){
    this.sucursal = this.sucursalesN[pos];
    this.posSucursal = pos;
    this.getLotes();
  }

  onChangeFecha(){
    this.getLotes();
  }

  getFechaSeleccionada() : String {
    var year = this.fecha.year;
    var month = this.fecha.month;
    var day = this.fecha.day;

    return "" + year + (month >= 10 ? month : "0" + month) + (day >= 10 ? day : "0" + day);
  }

  getSucursalSeleccionada(){
    return this.sucursales[this.posSucursal];
  }

  showModal(titulo, texto, aceptar, cancelar, cerrar, loading, icono){
    this.modalTitle = titulo;
    this.modalText = texto;
    this.showModalAceptar = aceptar;
    this.showModalCancelar = cancelar;
    this.showModalClose = cerrar;
    this.showModalLoading = loading;
    this.showOk = icono.toUpperCase() == 'OK';
    this.showError = icono.toUpperCase() == 'ERROR';
    this.showInfo = icono.toUpperCase() == 'INFO';
    document.getElementById("progressModalBtnOpen").click();
  }

  hideModal(){
    document.getElementById("progressModalBtnClose").click();
  }

}
