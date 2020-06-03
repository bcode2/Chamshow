import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { RoadshowService } from '../../api/roadshow.service';
import { CustomDatepickerI18n } from '../../injectables/customDatepickerI18n.service';
import { I18n } from '../../injectables/i18n.service';
import { NgbDatepickerI18n, NgbCalendar, NgbDate, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgbDatepickerConfig, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateFRParserFormatter } from "../../injectables/NgbDateFRParserFormatter.service";
import { PolyMouseEvent as AGMPolyEvent } from '@agm/core';
import { MouseEvent as AGMMouseEvent } from '@agm/core';
import * as moment from 'moment';

import {
  transition,
  trigger,
  style,
  animate,
  state
} from '@angular/animations';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['../main/main.component.scss'],
  providers: [I18n, {provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n},
                    {provide: NgbDateParserFormatter, useClass: NgbDateFRParserFormatter}],
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
export class ServiceComponent implements OnInit {

  //Variables de Pedidos
  pedidos = [];
  pedidosEnRuta = [];
  puntosRuta = [];
  pedidosBusqueda = [];
  pedidosUbicacion = {};
  pedidosSolapados = [];
  pedidosSolapadosCli = [];
  empleados = [];
  empleadosPP = [];
  viaticos = [];
  rutaFinal = [];
  cantTotalEq = 0;
  distanciaRecorrida = 0;
  viaticosTotal = 0;
  pedidosInsertados = 0;
  cantPedidosTotal = 0;
  cargandoDistancia = false;
  cargandoRutas = true;
  showTecnicos = true;
  pedidoSeleccionado;
  almuerzoAsignado = false;
  editMode = false;
  rutasMode = false;
  tiempoRuta = "09:00";
  modo = 'transit';
  fecha = {
    "year": 2019,
    "month": 1,
    "day": 30
  }

  //Para cuando se quiere cambiar de empleado
  empleadoSeleccionado;
  anteriorEmpleado;
  cambiaEmp = false;

  //Variables de Mapa
  cameraLatitude = -33.2266994;
  cameraLongitude = -60.9161475;
  zoom = 7;
  radio = 1;
  draggable = false;
  currentBounds;
  polylineWindowLat = 0;
  polylineWindowLng = 0;
  pedidoRadio = 300;
  showPedidoArea = false;

  //Info Window abierta
  infoWindowActiva;

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
  isFilterOn = false;

  //Filtros
  filtroLimp = false;
  filtroLimp4 = false;
  filtroLimp9 = false;
  filtroLimp16 = false;
  filtroElegido = 'T';
  filtroCantLimp = 0;
  filtroCantRepa = 0;
  filtroCantInst = 0;
  filtroCantVeri = 0;
  filtroEqTot = 0;
  filtroEqLimp = 0;
  filtroEqRepa = 0;
  filtroEqInst = 0;
  filtroEqVeri = 0;
  pedidosSinFiltrar = [];

  intentos = 0;
  url_transit = "./assets/ic_transit_active.png";
  url_driving = "./assets/ic_driving.png";
  colorArray = ["#950000", "#000000", "#bd3460", "#bddf74", "#bfb499",
                "#db63d6", "#5d34c3", "#0072c7", "#4fe1d6", "#aa85e5",
                "#f88379", "#fb5858", "#7f4618", "#dba520", "#c50dbd",
                "#bddf74", "#c50dbd", '#7d5fad'];

  constructor(private roadshowService: RoadshowService,
              private route: ActivatedRoute,
              private calendar: NgbCalendar,
              private cdr: ChangeDetectorRef) { }

  //Para datepicker
  isDisabled = (date: NgbDate, current: {month: number}) => date.month !== current.month;
  isWeekend = (date: NgbDate) =>  this.calendar.getWeekday(date) >= 6;

  ngOnInit() {
    this.fecha.year = moment().year();
    this.fecha.month = moment().month() + 1;
    this.fecha.day = moment().date();

    this.mostrarPedidosParaAsignarSalida();
  }

  onZoomChange(zoom){
    if(zoom == 12)
      this.pedidoRadio = 500;
    if(zoom == 13)
      this.pedidoRadio = 400;
    if(zoom == 14)
      this.pedidoRadio = 200;
    if(zoom == 15)
      this.pedidoRadio = 100;
    if(zoom == 16)
      this.pedidoRadio = 50;
    if(zoom >= 17)
      this.pedidoRadio = 20;
  }

  mostrarPedidosParaAsignarSalida(){
    this.cargandoRutas = true;
    this.pedidosSolapados = [];
    this.showModal("Pedidos de SETE", "Obteniendo pedidos para asignar salida.", false, false, false, true, 'No');

    this.roadshowService.getPedidosSETE().subscribe(res => {
      var i = 0;
      if(res){
        this.pedidos = res;
        this.pedidosSinFiltrar = res;
      }

      this.determinarPedidoSolapado(res);
      this.cdr.detectChanges();

      setTimeout(() => {
        this.hideModal();

        this.roadshowService.getEmpleadosSETE().subscribe(res => {
          if(res){
            this.empleados = res;
            this.empleadoSeleccionado = 0;
            this.anteriorEmpleado = 0;

            setTimeout(() => {
              this.getTotalRutasSETE();
              this.calcularCantidades();
            }, 500);
          }
        });

      }, 1000);
    },
    error => {
      this.cargandoRutas = false;
      this.hideModal();
      setTimeout(() => {
        this.showModal("Pedidos de SETE", "Hubo un error al tratar de obtener los pedidos. Asegúrese de que " +
                        "esté conectado a la red de Culligan.", false, false, true, false, 'ERROR');
        this.cdr.detectChanges();
        console.log(error);
      }, 500);
    });
  }

  calcularCantidades(){
    this.filtroCantLimp = 0;
    this.filtroCantRepa = 0;
    this.filtroCantInst = 0;
    this.filtroCantVeri = 0;
    this.filtroEqLimp = 0;
    this.filtroEqRepa = 0;
    this.filtroEqInst = 0;
    this.filtroEqVeri = 0;
    this.pedidos.forEach(pedido => {
      if (pedido.items[0].tipo_service == 'L') {
        this.filtroCantLimp++;
        this.filtroEqLimp += pedido.items[0].cantidad;
      }
      if (pedido.items[0].tipo_service == 'R') {
        this.filtroCantRepa++;
        this.filtroEqRepa += pedido.items[0].cantidad;
      }
      if (pedido.items[0].tipo_service == 'I') {
        this.filtroCantInst++;
        this.filtroEqInst += pedido.items[0].cantidad;
      }
      if (pedido.items[0].tipo_service == 'V') {
        this.filtroCantVeri++;
        this.filtroEqVeri += pedido.items[0].cantidad;
      }
    });
  }

  getTotalRutasSETE(){
    this.empleadosPP = [];
    this.empleados.forEach(emp => {
      this.empleadosPP["" + emp.numero] = {
        "nombre": emp.nombre, "total": 0, "limp" : 0, "rep": 0, "inst": 0, "veri": 0
      };
    });
    this.cargandoRutas = true;
    this.cdr.detectChanges();

    var fecha = this.getFechaSeleccionada();
    this.roadshowService.getRutasSETE(fecha, -1).subscribe(res => {
      if(res) {
        this.editMode = res.length > 0;
        res.forEach(pp => {
          pp.items.forEach(item => {
            if (!item.es_repuesto){
              if (item.tipo_service == 'L')
                this.empleadosPP[pp.empleado].limp++;
              if (item.tipo_service == 'R')
                this.empleadosPP[pp.empleado].rep++;
              if (item.tipo_service == 'I')
                this.empleadosPP[pp.empleado].inst++;
              if (item.tipo_service == 'V')
                this.empleadosPP[pp.empleado].veri++;

              this.empleadosPP[pp.empleado].total++;
            }
          });

        });
        this.cargandoRutas = false;
        this.cdr.detectChanges();
      }
    });
  }

  determinarPedidoSolapado(pedidos){
    for(var index in pedidos){
      var key = "" + pedidos[index].latitud + "," + pedidos[index].longitud;
      if(!this.pedidosUbicacion[key])
        this.pedidosUbicacion[key] = [];
      this.pedidosUbicacion[key].push(pedidos[index]);
    }

    for(var s in this.pedidosUbicacion){
      if(this.pedidosUbicacion[s].length > 1)
        this.pedidosSolapados.push(this.pedidosUbicacion[s]);
    }

    this.pedidosUbicacion = [];
    console.log(this.pedidosSolapados);
  }

  onClickCambioModo(modo){
    this.modo = modo;
    if(this.modo == 'transit'){
      this.url_transit = "./assets/ic_transit_active.png";
      this.url_driving = "./assets/ic_driving.png";
    }
    else{
      this.url_transit = "./assets/ic_transit.png";
      this.url_driving = "./assets/ic_driving_active.png";
    }

    if(this.pedidosEnRuta.length > 0){
        var pedidos = [];
        for(var i in this.pedidosEnRuta)
          if(!this.pedidosEnRuta[i].esAlmuerzo)
            pedidos.push(this.pedidosEnRuta[i]);

        this.resetRuta();
        this.recalcularTiempos(pedidos, 0);
    }
  }

  //Método recursivo para recalcular todos los tiempos de llegada y salida de los pedidos en ruta.
  recalcularTiempos(pedidos, i){
    console.log("Procesando pedido: " + i);
    if(i == pedidos.length)
      return;

    this.cantTotalEq += pedidos[i].pendientes;

    var indice = this.pedidosEnRuta.length;
    var pedido = pedidos[i];

    if(indice == 0){
      this.agregarPrimero(pedido);
      this.recalcularTiempos(pedidos, ++i);
    }
    else{
      this.cargandoDistancia = true;
      var origen, destino;

      origen = this.pedidosEnRuta[indice - 1];
      if(origen.esAlmuerzo)
        origen = this.pedidosEnRuta[indice - 2];

      destino = pedido;

      console.log("origen", origen);
      console.log("destino", destino);

      this.roadshowService.calcularDistancia(origen, destino, this.modo).subscribe(res => {
        this.cargandoRutas = false;
        this.cdr.detectChanges();
        if(res.rows[0].elements[0].status == 'OK'){
          this.setearInfoPedido(res, origen, destino);
          this.recalcularTiempos(pedidos, ++i);
        }
        else{
          this.roadshowService.calcularDistancia(origen, destino, 'driving').subscribe(res => {
            if(res.rows[0].elements[0].status == 'OK'){
              this.setearInfoPedido(res, origen, destino);
              this.recalcularTiempos(pedidos, ++i);
            }
            else{
              if(this.intentos == 3){
                console.log("Excedido los 3 intentos");
                return;
              }
              this.intentos++;
              this.recalcularTiempos(pedidos, i);
            }
          });
        }
      },
      error => {
        this.cargandoDistancia = false;
        console.log(error);
      });
    }
  }

  onDragEndRuta($event){
    console.log($event);
  }

  onDragEndMidpoint(punto, $event: AGMMouseEvent){
    console.log(punto);
    var newLat = $event.coords.lat;
    var newLng = $event.coords.lng;
    var newPoint = {"latitud": newLat, "longitud": newLng};

    var pedido = null;
    var distancias = [];
    for(var i in this.pedidos){
      var dist = this.distanceInKm(newPoint, this.pedidos[i]);
      distancias.push({"pedido": this.pedidos[i], "distancia": dist});
    }
    distancias.sort((a, b) => {
      return a.distancia - b.distancia;
    });

    if(distancias[0].distancia * 1000 <= this.pedidoRadio)
      pedido = distancias[0].pedido;

    if(pedido)
      this.agregarPedidoEntre(punto, pedido);
    else{
      var index = this.puntosRuta.indexOf(punto);
      this.puntosRuta.splice(index, 1);
      this.cdr.detectChanges();
      this.puntosRuta.splice(index, 0, punto);
      this.cdr.detectChanges();
    }
  }

  distanceInKm(punto1, punto2) {
    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(punto2.latitud-punto1.latitud);  // deg2rad below
    var dLon = this.deg2rad(punto2.longitud-punto1.longitud);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(punto1.latitud)) * Math.cos(this.deg2rad(punto2.latitud)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  //Muestra la info del cliente (marcador) seleccionado
  onClickMarker(infowindow, pedido) {
    if (this.infoWindowActiva)
      this.infoWindowActiva.close();

    this.infoWindowActiva = infowindow;

    this.pedidosSolapadosCli = [];

    for(var i in this.pedidosSolapados){
      for(var j in this.pedidosSolapados[i]){
        var solapado = this.pedidosSolapados[i][j];
        if(solapado.latitud == pedido.latitud && pedido.longitud == pedido.longitud)
          this.pedidosSolapadosCli.push(solapado);
      }
    }

    console.log(pedido);
    console.log(this.pedidosSolapadosCli);

    this.pedidosSolapadosCli.splice(this.pedidosSolapadosCli.indexOf(pedido), 1);
    /*this.cameraLatitude = pedido.latitud;
    this.cameraLongitude = pedido.longitud;*/
  }

  //Cuando se hace click en el botón "Agregar" del marcador
  onClickAgregar(pedido){
    console.log(pedido);
    console.log(this.puntosRuta);
    this.cantTotalEq += pedido.pendientes;

    if(this.pedidosEnRuta.length == 0){
      this.agregarPrimero(pedido);
    }
    else{
      //Calculo de distancia
      this.agregarPedido(pedido);
    }

    this.cdr.detectChanges();
  }

  agregarPrimero(pedido){
    this.viaticos.push(0);
    this.pedidosEnRuta.push(pedido);
    pedido.llegada = this.tiempoRuta;

    this.actualizarTiempoRuta(0, pedido.tiempo_trabajo);
    pedido.distancia = 0;
    pedido.viaje = 0;
    pedido.salida = this.tiempoRuta;
    pedido.en_ruta = true;
    pedido.orden = 10;
    pedido.abrir = false;
    pedido.empleado = this.empleados[this.empleadoSeleccionado].numero;
    pedido.ruta = parseInt(this.empleadoSeleccionado) + 1;
    pedido.fecha_ruteo = "" + this.fecha.year
      + (this.fecha.month >= 10 ? this.fecha.month :  ("0" + this.fecha.month))
      + (this.fecha.day >= 10 ? this.fecha.day : ("0" + this.fecha.day));

    this.verificarHorarios(pedido);
    this.setPolylines(pedido, null);

    if (this.infoWindowActiva)
      this.infoWindowActiva.close();
  }

  agregarPedidoEntre(punto, pedido){
    var pedidosFinal = [];

    for(var i in this.pedidosEnRuta){
      if(this.pedidosEnRuta[i] == punto.destino)
        pedidosFinal.push(pedido);

      if(!this.pedidosEnRuta[i].esAlmuerzo)
        pedidosFinal.push(this.pedidosEnRuta[i]);
    }

    console.log(pedidosFinal);

    this.resetRuta();
    this.recalcularTiempos(pedidosFinal, 0);
  }

  agregarPedido(pedido){
    var indice = this.pedidosEnRuta.length;

    this.cargandoDistancia = true;
    var origen, destino;

    origen = this.pedidosEnRuta[indice - 1];
    if(origen.esAlmuerzo)
      origen = this.pedidosEnRuta[indice - 2];

    destino = pedido;

    this.enrutarPedido(origen, destino, this.modo);
  }

  enrutarPedido(origen, destino, modo){
    this.roadshowService.calcularDistancia(origen, destino, modo).subscribe(res => {
      if(res.rows[0].elements[0].status == 'OK'){
        this.setearInfoPedido(res, origen, destino);
      }
      else{
        if(this.intentos == 3){
          console.log("Excedido los 3 intentos");
          return;
        }
        this.intentos++;
        this.enrutarPedido(origen, destino, 'driving');
      }
    });
  }

  //Una vez descargado la data de la API de distance matrix se asigna esa info al pedido
  setearInfoPedido(res, origen, destino){
    var distancia = res.rows[0].elements[0].distance.value;
    this.distanciaRecorrida += distancia;

    var importe = 0;
    if(res.rows[0].elements[0].fare)
      importe = res.rows[0].elements[0].fare.value;

    this.viaticosTotal += importe;
    this.viaticos.push(importe);

    var tiempo_viaje = res.rows[0].elements[0].duration.value;
    var tiempo_trabajo = destino.tiempo_trabajo;

    var temprano = false;

    //Receso de Almuerzo
    if(this.esHorarioAlmuerzo(tiempo_viaje, tiempo_trabajo) && !this.almuerzoAsignado){
      console.log("entra a almuerzo");
      var franja = moment.utc(this.tiempoRuta, "HH:mm");
      franja.add(tiempo_viaje, 'seconds');
      franja.add(tiempo_trabajo, 'minutes');
      var mediodia = moment.utc("13:20", "HH:mm");
      temprano = franja < mediodia;

      //Se invierte la asignación del receso en caso de que sea muy temprano
      if(temprano)
        this.asignaTiempos(destino, tiempo_viaje, tiempo_trabajo);

      var receso = {};
      this.pedidosEnRuta.push(receso);

      receso['llegada'] = this.tiempoRuta;
      this.actualizarTiempoRuta(0, 45);
      receso['salida'] = this.tiempoRuta;
      receso['esAlmuerzo'] = true;
      this.almuerzoAsignado = true;
    }

    destino.distancia = distancia;
    destino.viaje = tiempo_viaje;
    destino.orden = origen.orden + 10;
    destino.empleado = this.empleados[this.empleadoSeleccionado].numero;
    destino.ruta = parseInt(this.empleadoSeleccionado) + 1;
    destino.fecha_ruteo = "" + this.fecha.year
      + (this.fecha.month >= 10 ? this.fecha.month :  ("0" + this.fecha.month))
      + (this.fecha.day >= 10 ? this.fecha.day : ("0" + this.fecha.day));

    /*if(this.editMode){
        destino.llegada = "00:00";
        var time = moment.utc("00:00", "HH:mm");
        time.add(tiempo_trabajo, 'minutes');
        destino.salida = time.format("HH:mm");

        this.pedidosEnRuta.push(destino);
        this.cargandoDistancia = false;
        destino.en_ruta = true;
    }*/

    if(!temprano)
      this.asignaTiempos(destino, tiempo_viaje, tiempo_trabajo);

    this.setPolylines(origen, destino);

    destino.abrir = false;
    if (this.infoWindowActiva && this.pedidosSolapadosCli.length == 0)
      this.infoWindowActiva.close();

    this.cdr.detectChanges();
  }

  setPolylines(origen, destino){
    if(!destino){
      this.puntosRuta.push({ "latitud": origen.latitud, "longitud": origen.longitud });
      return;
    }

    var midLatitude = (origen.latitud + destino.latitud) / 2;
    var midLongitude = (origen.longitud + destino.longitud) / 2;
    var midPoint = {
      "latitud": midLatitude,
      "longitud": midLongitude,
      "origen": origen,
      "destino": destino,
      "midpoint": true,
      "elevation": 1
    }
    this.puntosRuta.push(midPoint);
    this.puntosRuta.push({ "latitud": destino.latitud, "longitud": destino.longitud, "midpoint": false });
  }

  asignaTiempos(pedido, tiempo_viaje, tiempo_trabajo){
    console.log("tiempo rute: " + this.tiempoRuta);
    //Sumamos tiempo de viaje
    this.actualizarTiempoRuta(tiempo_viaje, 0);
    pedido.llegada = this.tiempoRuta;

    //Sumamos tiempo de trabajo
    this.actualizarTiempoRuta(0, tiempo_trabajo);
    pedido.salida = this.tiempoRuta;

    this.verificarHorarios(pedido);

    this.pedidosEnRuta.push(pedido);

    this.cargandoDistancia = false;
    pedido.en_ruta = true;
  }

  actualizarTiempoRuta(tiempo_viaje, tiempo_trabajo){
    var time = moment.utc(this.tiempoRuta, "HH:mm");
    time.add(tiempo_viaje, 'seconds');
    time.add(tiempo_trabajo, 'minutes');
    this.tiempoRuta = time.format("HH:mm");
  }

  esHorarioAlmuerzo(tiempo_viaje, tiempo_trabajo){
    var time = moment.utc(this.tiempoRuta, "HH:mm");
    var horarioAlmuerzo = moment.utc("13:10", "HH:mm");

    time.add(tiempo_viaje, 'seconds');
    time.add(tiempo_trabajo, 'minutes');

    return time > horarioAlmuerzo;
  }

  //Click en botón quitar del pedido
  onClickQuitar(pedido){
    var length = this.pedidosEnRuta.length;
    var index = this.pedidosEnRuta.indexOf(pedido);
    var indexV = this.viaticos[index] || this.viaticos[index] == 0 ? index : index - 1;

    console.log("indice quitado:", index);

    this.cantTotalEq -= pedido.pendientes;
    this.viaticosTotal -= this.viaticos[indexV];
    this.viaticos.splice(indexV, 1);
    this.distanciaRecorrida -= this.pedidosEnRuta[index].distancia;
    pedido.en_ruta = false;

    if(index != -1){
      var i = index;
      //Validación si el receso de almuerzo está contiguo al pedido a borrar
      if(this.pedidosEnRuta[index - 1] && this.pedidosEnRuta[index - 1].esAlmuerzo){
        this.pedidosEnRuta.splice(index, 1);
        this.almuerzoAsignado = false;
        i--;
      }
      else if(this.pedidosEnRuta[index + 1] && this.pedidosEnRuta[index + 1].esAlmuerzo){
        this.almuerzoAsignado = false;
        this.pedidosEnRuta.splice(index + 1, 1);
      }

      this.pedidosEnRuta.splice(i, 1);

      if(index == 0 || index == length - 1){
        this.puntosRuta.splice(this.puntosRuta.length - 2, 2);
        if(this.pedidosEnRuta[i - 1])
          this.tiempoRuta = this.pedidosEnRuta[i - 1].salida;
        else
          this.tiempoRuta = "09:00";

        if (this.infoWindowActiva)
          this.infoWindowActiva.close();

        return;
      }

      var pedidosFinal = [];
      for(var j in this.pedidosEnRuta)
        if(!this.pedidosEnRuta[j].esAlmuerzo)
          pedidosFinal.push(this.pedidosEnRuta[j]);

      this.resetRuta();
      this.recalcularTiempos(pedidosFinal, 0);
    }
  }

  verificarHorarios(pp) {
    var horario1_desde = moment.utc(pp.horario1_desde, "HH:mm");
    var horario1_hasta = moment.utc(pp.horario1_hasta, "HH:mm");
    var horario2_desde = moment.utc(pp.horario2_desde, "HH:mm");
    var horario2_hasta = moment.utc(pp.horario2_hasta, "HH:mm");

    //Llegada
    var llegada = moment.utc(pp.llegada, "HH:mm");
    var min = llegada.diff(horario1_hasta, 'minutes');
    console.log("Pedido " + pp.razon_social);
    console.log("LLegada hasta: " + min);
    pp.llegada_fuera = min > 0;

    if (!pp.llegada_fuera) {
      min = llegada.diff(horario1_desde, 'minutes');
      console.log("Llegada desde: " + min);
      pp.llegada_fuera = min < 0;
    }

    if (pp.horario2_desde == "00:00:00" || !pp.llegada_fuera)
      console.log("No comprobar horario 2");
    else{
      min = llegada.diff(horario2_desde, 'minutes');
      console.log("Horario 2");
      console.log("Llegada desde: " + min);
      pp.llegada_fuera = min < 0;

      if (!pp.llegada_fuera){
        min = llegada.diff(horario2_hasta, 'minutes');
        console.log("LLegada hasta: " + min);
        pp.llegada_fuera = min > 0;
      }
    }
    console.log("Resultado llegada: " + pp.llegada_fuera);

    /*if (pp.llegada_fuera) {
      pp.llegada = pp.horario1_desde.substring(0, 5);
      this.tiempoRuta = pp.llegada;
      this.actualizarTiempoRuta(0, pp.tiempo_trabajo);
      pp.salida = this.tiempoRuta;
    }*/

    //Salida
    var salida = moment.utc(pp.salida, "HH:mm");
    min = salida.diff(horario1_hasta, 'minutes');
    console.log("Salida horario1: " + min);
    pp.salida_fuera = min > 0;

    //if(!pp.llegada_fuera && pp.salida_fuera)
    //  return;

    if (pp.horario2_desde == "00:00:00")
      console.log("No comprobar horario 2");
    else{
      min = salida.diff(horario2_desde);
      if (min < 0)
        return;

      min = salida.diff(horario2_hasta, 'minutes');
      console.log("Salida horario2: " + min);
      pp.salida_fuera = min > 0;
    }
    console.log("Resultado salida: " + pp.salida_fuera);
  }

  //Cuando se presiona enter en el buscador de la esquina superior derecha
  onEnterCodigo(codigo){
    this.pedidosBusqueda = [];
    var encontrado = false;
    for(var i in this.pedidos) {
      if (this.pedidos[i].numero == codigo || this.pedidos[i].cliente == codigo){
        encontrado = true;
        this.pedidosBusqueda.push(this.pedidos[i]);
      }
    }
    if(!encontrado){
      document.getElementById("progressModalBtnOpen").click();
      this.showModalClose = true;
      this.showModalLoading = false;
      this.showModalAceptar = false;
      this.showModalCancelar = false;
      this.modalTitle = "Atención";
      this.modalText = "No se ha encontrado cliente o PP solicitado.";
    }
  }

  onClickPedidoEnRuta(pedido){
    if(this.pedidoSeleccionado)
      this.pedidoSeleccionado.abrir = false;

    this.pedidoSeleccionado = pedido;
    if(this.infoWindowActiva)
      this.infoWindowActiva.close();
    pedido.abrir = true;
    this.cameraLatitude = pedido.latitud;
    this.cameraLongitude = pedido.longitud;
  }

  getLineColor(i) {
      return this.colorArray[i];
  }

  onClickAtras() {
    this.showTecnicos = true;
    this.pedidosEnRuta.forEach(pp => {
      pp.en_ruta = false;
      if (pp.estado == 69) {
        var index = this.pedidos.indexOf(pp);
        this.pedidos.splice(index, 1);
      }
    });

    this.resetRuta();
    this.cdr.detectChanges();
  }

  onClickEmpleado(i) {
    this.empleadoSeleccionado = i;
    this.showTecnicos = false;

    this.pedidosEnRuta.forEach(pp => {
      pp.en_ruta = false;
      if(pp.estado == 69){
        var index = this.pedidos.indexOf(pp);
        this.pedidos.splice(index, 1);
      }
    });

    this.getRuta(this.getFechaSeleccionada(), this.empleados[this.empleadoSeleccionado]);
  }

  onChangeSelectEmpleado() {
    console.log("Anterior: " + this.anteriorEmpleado);
    console.log("Actual: " + this.empleadoSeleccionado);

    var title = "Atención";
    var text = "Se borrará todo cambio que no se haya grabado.";
    this.showModal(title, text, true, true, false, false, 'Info');
    document.getElementById("progressModalBtnOpen").click();
  }

  onClickAceptarModal(){
    if(this.isFilterOn){
      this.pedidos = this.pedidosSinFiltrar;
      this.pedidos = this.pedidos.filter(p => p.items[0].tipo_service == this.filtroElegido);

      if (this.filtroElegido == 'L'){
        var pedidos, pedidos4, pedidos9, pedidos16;
        pedidos = this.pedidos.filter(p => p.items[0].cantidad < 4);
        pedidos4 = this.pedidos.filter(p => p.items[0].cantidad >= 4 && p.items[0].cantidad < 9);
        pedidos9 = this.pedidos.filter(p => p.items[0].cantidad >= 9 && p.items[0].cantidad < 16);
        pedidos16 = this.pedidos.filter(p => p.items[0].cantidad >= 16);

        console.log("pedidos: ", pedidos);
        console.log("pedidos: 4", pedidos4);
        console.log("pedidos: 9", pedidos9);
        console.log("pedidos: 16", pedidos16);
        this.pedidos = [];

        if (this.filtroLimp) this.pedidos = this.pedidos.concat(pedidos);
        if (this.filtroLimp4) this.pedidos = this.pedidos.concat(pedidos4);
        if (this.filtroLimp9) this.pedidos = this.pedidos.concat(pedidos9);
        if (this.filtroLimp16) this.pedidos = this.pedidos.concat(pedidos16);
      }

      if(this.filtroElegido == 'T'){
        this.isFilterOn = false;

        setTimeout(() => {
          this.pedidos = this.pedidosSinFiltrar;
          this.cdr.detectChanges();
        }, 400);
      }

      return;
    }

    console.log(this.pedidosEnRuta);
    for(var i in this.pedidosEnRuta){
      this.pedidosEnRuta[i].en_ruta = false;
      if(this.pedidosEnRuta[i].estado == 69){
        var index = this.pedidos.indexOf(this.pedidosEnRuta[i]);
        this.pedidos.splice(index, 1);
      }
    }

    this.resetRuta();
    this.anteriorEmpleado = this.empleadoSeleccionado;

    this.cargandoRutas = true;

    this.onClickCambioModo(this.empleados[this.empleadoSeleccionado].caminante ? 'transit' : 'driving');
    this.getRuta(this.getFechaSeleccionada(), this.empleados[this.empleadoSeleccionado]);
  }

  onClickCancelarModal(){
    if (this.isFilterOn)
      this.isFilterOn = this.filtroElegido != 'T';
    /*this.empleadoSeleccionado = this.anteriorEmpleado;
    console.log("Cerrar");
    console.log("Anterior: " + this.anteriorEmpleado);
    console.log("Actual: " + this.empleadoSeleccionado);*/
  }

  onChangeFecha(){
    this.getTotalRutasSETE();
    /*console.log("Anterior: " + this.anteriorEmpleado);
    console.log("Actual: " + this.empleadoSeleccionado);

    var title = "Atención";
    var text = "Se borrará todo cambio que no se haya grabado.";
    this.showModal(title, text, true, true, false, false, 'Info');
    document.getElementById("progressModalBtnOpen").click();*/
  }

  getRuta(fecha, empleado){
    this.cargandoRutas = true;
    this.cdr.detectChanges();
    this.roadshowService.getRutasSETE(fecha, empleado.numero).subscribe(res => {
      if(res){
        this.editMode = res.length > 0;
        this.mostrarRutaTecnico(res, empleado);
        this.determinarPedidoSolapado(res);
      }
    });
  }

  mostrarRutaTecnico(res, empleado){
    //Cambia el modo segun tecnico
    this.onClickCambioModo(empleado.caminante ? 'transit' : 'driving');

    this.pedidosEnRuta = res;
    this.pedidos = this.pedidos.concat(res);
    for(var i in this.pedidosEnRuta) {
      var index = parseInt(i);
      var pedido = this.pedidosEnRuta[i];
      this.cantTotalEq += pedido.pendientes;
      this.distanciaRecorrida += pedido.distancia;
      if(index > 0)
        this.setPolylines(this.pedidosEnRuta[index-1], pedido);
      else
        this.setPolylines(pedido, null);
    }

    var midPoint = Math.round(this.pedidosEnRuta.length / 2);
    console.log(midPoint);
    if (this.pedidosEnRuta.length == 1)
      midPoint = 0;
    if (this.pedidosEnRuta.length != 0) {
      this.zoom = this.zoom == 14? 13 : 14;
      this.cameraLatitude = this.pedidosEnRuta[midPoint].latitud;
      this.cameraLongitude =  this.pedidosEnRuta[midPoint].longitud;
    }

    if(this.rutasMode){
      empleado.puntosRuta = this.puntosRuta;
      this.puntosRuta = [];
    }
    if(this.pedidosEnRuta.length != 0)
      this.tiempoRuta = this.pedidosEnRuta[this.pedidosEnRuta.length - 1].salida;
    this.cargandoRutas = false;
    this.cdr.detectChanges();
  }

  getFechaSeleccionada() : String {
    var year = this.fecha.year;
    var month = this.fecha.month;
    var day = this.fecha.day;

    return "" + year + (month >= 10 ? month : "0" + month) + (day >= 10 ? day : "0" + day);
  }

  getFechaFormat() : String {
    var year = this.fecha.year;
    var month = this.fecha.month;
    var day = this.fecha.day;

    return "" + (day >= 10 ? day : "0" + day) + "/" + (month >= 10 ? month : "0" + month) + "/" + year;
  }

  onClickVerRutas(){
    this.resetAll();

    if(this.rutasMode){
      this.rutasMode = !this.rutasMode;
      this.mostrarPedidosParaAsignarSalida();
      return;
    }

    this.rutasMode = !this.rutasMode;

    this.mostrarTodasRutas(0);
  }

  mostrarTodasRutas(contEmp){
    if(contEmp == this.empleados.length - 1)
      return;

    var fecha = this.getFechaSeleccionada();
    var emp = this.empleados[contEmp];
    this.roadshowService.getRutasSETE(fecha, emp.numero).subscribe(res => {
      if(res){
        this.cantPedidosTotal += res.length;
        this.mostrarRutaTecnico(res, emp);
        this.pedidosEnRuta = [];
        this.mostrarTodasRutas(++contEmp);
        console.log(this.empleados);
        //this.determinarPedidoSolapado(res);
      }
    });
  }

  onClickInvertir(){
    var pedidosFinal = [];
    pedidosFinal = this.pedidosEnRuta.reverse();
    pedidosFinal = pedidosFinal.filter(pp => !pp.esAlmuerzo);

    this.cargandoRutas = true;
    this.resetRuta();
    this.cdr.detectChanges();

    this.recalcularTiempos(pedidosFinal, 0);
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

  //Creado por un tema de tiempos
  showModalAux(titulo, texto, aceptar, cancelar, cerrar, loading, icono){
    this.modalTitle = titulo;
    this.modalText = texto;
    this.showModalAceptar = aceptar;
    this.showModalCancelar = cancelar;
    this.showModalClose = cerrar;
    this.showModalLoading = loading;
    this.showOk = icono.toUpperCase() == 'OK';
    this.showError = icono.toUpperCase() == 'ERROR';
    this.showInfo = icono.toUpperCase() == 'INFO';
  }

  hideModal(){
    document.getElementById("progressModalBtnClose").click();
  }

  resetAll(){
    this.pedidos = [];
    this.pedidosSolapados = [];
    this.pedidosEnRuta = [];
    this.puntosRuta = [];
    this.cantTotalEq = 0;
    this.viaticosTotal = 0;
    this.distanciaRecorrida = 0;
    this.pedidosSolapados = [];
    this.almuerzoAsignado = false;
    this.tiempoRuta = "09:00";
  }

  resetRuta(){
    this.pedidosEnRuta = [];
    this.puntosRuta = [];
    this.cantTotalEq = 0;
    this.viaticosTotal = 0;
    this.distanciaRecorrida = 0;
    this.almuerzoAsignado = false;
    this.tiempoRuta = "09:00";
  }

  onClickFiltrar(){
    this.isFilterOn = true;
    this.showModal("Filtrar", "", true, true, false, false, "No");
  }

  onClickFiltro(opcion){
    if (opcion != 'L') {
      this.filtroLimp = false;
      this.filtroLimp4 = false;
      this.filtroLimp9 = false;
      this.filtroLimp16 = false;
    }

    this.filtroElegido = opcion;
  }

  onClickUrgente(pedido) {
    this.cargandoDistancia = true;
    this.roadshowService.marcarPedidoUrgente(pedido, pedido.urgente ? 0 : 1).subscribe(res => {
      if (!pedido.urgente){
        pedido.icon = "./assets/ic_urg.png";
        pedido.elevation = 4;
      }
      else{
        pedido.icon = this.getIcon(pedido.items);
        pedido.elevation = 1;
      }
      pedido.urgente = !pedido.urgente;
      this.cargandoDistancia = false;
      this.cdr.detectChanges();
    },
    error => {
      console.log(error);
      this.cargandoDistancia = false;
      this.cdr.detectChanges();
    });
  }

  onClickEspecial(pedido){
    this.cargandoDistancia = true;
    this.roadshowService.marcarPedidoEspecial(pedido, pedido.especial ? 0 : 1).subscribe(res => {
      if (!pedido.especial){
        pedido.icon = "./assets/ic_star.png";
        pedido.elevation = 3;
      }
      else{
        pedido.icon = this.getIcon(pedido.items);
        pedido.elevation = 1;
      }
      pedido.especial = !pedido.especial;
      this.cargandoDistancia = false;
      this.cdr.detectChanges();
    },
    error => {
      console.log(error);
      this.cargandoDistancia = false;
      this.cdr.detectChanges();
    });
  }

  getIcon(items) : String {
    var icon = "./assets/ic_limp.png";
    for(var index in items){
      var i = items[index];
      if (!i.es_repuesto)
        if (i.tipo_service == 'L'){
          if (i.cantidad >= 4)
            icon = "./assets/ic_limp4.png";
          if (i.cantidad >= 9)
            icon = "./assets/ic_limp9.png";
          if (i.cantidad >= 16)
            icon = "./assets/ic_limp16.png";
        }
        if (i.tipo_service == 'R')
          icon = "./assets/ic_rep.png";
        if (i.tipo_service == 'V')
          icon = "./assets/ic_ver.png";
        if (i.tipo_service == 'I')
          icon = "./assets/ic_inst.png";
    }
    return icon;
  }

  //Método que graba la ruta en la tabla ROADSHOW_RUTEO
  //
  //En este for se construye el json final que se enviará.
  //Por lo tanto se hacen dos cosas importantes:
  //1.  Agregamos todos los pedidos menos el item que representa al receso de almuerzo.
  //2.  Sólo se necesita un "item_pedido" por pedido. Los repuestos no se agregan. En el caso de
  //    tener dos servicios o más, solo agregamos el de mayor cantidad.
  onClickGrabar(){
    this.showModalLoading = true;
    this.rutaFinal = [];

    for(var i in this.pedidosEnRuta){
      var pedido = this.pedidosEnRuta[i];
      pedido.estado = 69;
      var multiple = false;
      if(!pedido.esAlmuerzo){
        if(pedido["items"].length > 1){
          multiple = true;
          var jsonItems = [];
          var maxItem;
          var max = 0;
          for(var i in pedido.items){
            var item = pedido.items[i];
            if(!item.es_respuesto){
              console.log(item);

              if(max < item.cantidad)
                maxItem = item;
              }
          }
          jsonItems.push(maxItem);
        }
        this.rutaFinal.push(pedido);
        if(multiple)
          this.rutaFinal[this.rutaFinal.length - 1].items = jsonItems;

        //Como el webservice no admite "&" por parámetro entonces debe eliminarse. Ej: Litros & Pesos.
        var forma_comercial = this.rutaFinal[this.rutaFinal.length - 1].items[0].forma_comercial;
        forma_comercial = forma_comercial.replace("&", "y");
        this.rutaFinal[this.rutaFinal.length - 1].items[0].forma_comercial = forma_comercial;
      }
    }

    //Para actualizar el contador de PP de tecnicos de la lista principal
    this.empleadosPP[pedido.empleado].limp = 0;
    this.empleadosPP[pedido.empleado].rep = 0
    this.empleadosPP[pedido.empleado].inst = 0;
    this.empleadosPP[pedido.empleado].veri = 0;
    this.empleadosPP[pedido.empleado].total = 0;
    var emp = this.empleados[this.empleadoSeleccionado].numero;
    console.log(this.pedidosEnRuta);
    this.pedidosEnRuta.forEach(pp => {
      if (!pp.esAlmuerzo){
        pp.items.forEach(item =>{
          if (!item.es_repuesto){
            if (item.tipo_service == 'L')
              this.empleadosPP[emp].limp++;
            if (item.tipo_service == 'R')
              this.empleadosPP[emp].rep++;
            if (item.tipo_service == 'I')
              this.empleadosPP[emp].inst++;
            if (item.tipo_service == 'V')
              this.empleadosPP[emp].veri++;

            this.empleadosPP[emp].total++;
          }
        })
      };
    });

    console.log(this.empleadosPP);

    this.showModal("Generación de Ruta", "Grabando ruta, espere un momento por favor...", false, false, false, true, "No");

    var json = JSON.stringify(this.rutaFinal);
    console.log(json);
    this.roadshowService.grabarRuta(json).subscribe(res => {
      setTimeout(() => {
        if(res.insertados == 0){
          this.modalText = "Ha ocurrido un error al grabar la ruta.";
          this.showModalAux("Generación de Ruta", this.modalText, false, false, true, false, "Error");
        }

        if(res.insertados == (this.pedidosEnRuta.length - 1) || res.insertados == this.pedidosEnRuta.length){
          this.modalText = "La ruta se ha generado correctamente.<br>";
          this.modalText += "<b>" + res.insertados + "</b> clientes insertados en la ruta.<br>";
          this.modalText += "<b>" + res.eliminados + "</b> clientes eliminados de la ruta.<br>";
          this.modalText += "<b>" + res.actualizados + "</b> pedidos cambiados a 'En Ruta'.<br>";
          this.showModalAux("Generación de Ruta", this.modalText, false, false, true, false, "Ok");
        }

        console.log(res);
        console.log(this.pedidosEnRuta.length);
        this.cdr.detectChanges();
      }, 1500);
    });
  }
}
