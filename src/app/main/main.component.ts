import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { RoadshowService } from '../../api/roadshow.service';
import { MouseEvent as AGMMouseEvent } from '@agm/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent implements OnInit {

  paramCliente;
  paramSuc;

  title = 'Roadshow';
  cameraLatitude = -33.2266994;
  cameraLongitude = -60.9161475;
  zoom = 7;
  radio = 1;
  draggable = false;

  clientes = [];
  clientesCluster = [];
  clientesSolapados = [];
  clientesSolapadosView = [];
  cli = "";
  posCliSelect;
  location;
  direc = "";
  geocodeMode = false;
  clusterImagePath = "";
  isAgrupado = false;

  rutas = [];
  rutasCant = [];
  Object = Object;
  infoWindowActiva;
  showLoader = true;
  showRutas = false;
  showClientes = false;
  showModalClose = false;
  showModalGeo = false;
  showModalAceptar = false;
  modalText = "Cargando clientes. Espere por favor...";
  modalTextColor = 0;

  posSucursal = 0;
  sucursal = "Bs. As.";
  sucursales = [ "sparkling", "rosario", "cordoba", "santafe", "laplata", "campana" ];
  sucursalesN = [ "Buenos Aires", "Rosario", "Córdoba", "Santa Fe", "La Plata", "Campana" ];

  constructor(private roadshowService: RoadshowService,
              private route: ActivatedRoute,
              private cdr: ChangeDetectorRef){}

  ngOnInit(){
    //Parámetros capturados de la URL
    this.route.paramMap.subscribe(paramMap => {
      if(paramMap["params"].cliente) {
        this.posSucursal = this.sucursales.indexOf(paramMap["params"].sucursal);
        this.sucursal = this.sucursalesN[this.posSucursal];
        this.onEnterCliente(paramMap["params"].cliente);
      }
    });
  }

  //Método para dragear al marcador por el mapa
  onMarkerDragEnd(c, $event: AGMMouseEvent) {
    console.log('dragEnd', c, $event);
    this.location.lat = parseFloat($event.coords.lat.toFixed(7));
    this.location.lng = parseFloat($event.coords.lng.toFixed(7));
    this.cameraLatitude = this.location.lat;
    this.cameraLongitude = this.location.lng;
  }

  onMarkerDrag($event: AGMMouseEvent){
    console.log('dragEnd', $event);
    console.log("hola");
  }

  //Muestra la info del cliente (marcador) seleccionado
  onClickMarker(infowindow, cliente) {
    if (this.infoWindowActiva)
      this.infoWindowActiva.close();
    else
      this.clientes[this.posCliSelect].ingresado = false;

    console.log(this.posCliSelect);

    this.infoWindowActiva = infowindow;

    this.clientesSolapadosView = [];

    for(var i in this.clientesSolapados){
      for(var j in this.clientesSolapados[i]){
        var solapado = this.clientesSolapados[i][j];
        if(cliente.latitud == solapado.latitud && cliente.longitud == solapado.longitud)
          this.clientesSolapadosView.push(solapado);
      }
    }

    console.log(this.clientesSolapadosView);

    this.clientesSolapadosView.splice(this.clientesSolapadosView.indexOf(cliente), 1);
 }

  onEnterCliente(cliente: string){
    this.draggable = false;
    this.direc = '';
    this.cli = cliente;
    this.clientes = [];
    this.geocodeMode = false;
    this.showLoader = true;
    this.showModalClose = false;
    this.showModalGeo = false;
    this.modalText = "Cargando clientes. Espere por favor...";
    this.modalTextColor = 0;
    var suc = this.sucursales[this.posSucursal];
    var radioFinal = this.radio / 100;
    this.rutas = [];
    this.rutasCant = [];

    //Mostrar el modal para el progreso de búsqueda
    document.getElementById("progressModalBtnOpen").click();

    this.roadshowService.getClientesCercanos(cliente, suc, radioFinal).subscribe(res => {

      if(!res.existe){
        this.showLoader = false
        this.showModalClose = true;
        this.showModalGeo = false;
        this.modalText = "El cliente solicitado no existe.";
        this.cdr.detectChanges();
        return;
      }

      if(!res.tieneGeo) {
        this.showLoader = false
        this.showModalClose = true;
        this.showModalGeo = true;
        this.modalText = "El cliente no está geocodificado.";
        this.clientes = res.clientes;
        this.direc = this.clientes[0].direccion;
        this.direc += (' ' + this.clientes[0].localidad);
        this.cdr.detectChanges();
        return;
      }

      this.clientes = res.clientes;
      var contRuta = 0;
      var otras = 0;

      //Si la cant de clientes cercanos supera las 1500, se vuelve a buscar pero con la mitad de radio.
      if(this.clientes.length > 1500){
        this.radio = this.radio / 2;
        document.getElementById("progressModalBtnClose").click();
        this.onEnterCliente(cliente);
        return;
      }

      for(var pos in this.clientes){
        var cli = this.clientes[pos];

        //Acercar camara al cliente ingresado
        if(cli.codigo == parseInt(cliente)){
          this.posCliSelect = pos;
          if(this.zoom == 7)
            this.zoom = 15;
          this.cameraLatitude = cli.latitud;
          this.cameraLongitude = cli.longitud;
          this.direc = cli.direccion;
          this.direc += (' ' + cli.localidad);
        }

        //Conteo de rutas
        if(contRuta != 35)
          this.rutas[cli.ruta_madre] = cli.icon;
        if(this.rutasCant[cli.ruta_madre])
          this.rutasCant[cli.ruta_madre] = this.rutasCant[cli.ruta_madre] + 1
        else{
          if(contRuta == 35)
            otras += 1;
          else{
            contRuta += 1;
            this.rutasCant[cli.ruta_madre] = 1
          }
        }
      }

      if(otras != 0){
        this.rutasCant["Otras"] = otras;
        this.rutas["Otras"] = "https://raw.githubusercontent.com/Concept211/Google-Maps-Markers/master/images/marker_white.png"
      }

      //Despliega el menú de rutas
      this.onClickRutas();

      this.determinarClienteSolapados();

      setTimeout(() => {
        //Cierra el modal de progreso
        this.showLoader = false;
        document.getElementById("progressModalBtnClose").click();
        this.cdr.detectChanges();
      }, 1500);

    },
    err => {
      console.log(err);
      this.showLoader = false
      this.showModalClose = true;
      this.showModalGeo = false;
      this.modalText = "Hubo un error al consultar los datos.";
      this.cdr.detectChanges();
    }
  ); //Fin Webservice
  }

  onEnterDireccion(direccion){
    this.roadshowService.geocodificar(direccion).subscribe(res => {
      console.log(res);
      this.geocodeMode = true;
      var cliente = this.clientes[0];
      console.log(cliente);
      if(res.status == 'OK'){
        this.location = res.results[0].geometry.location;
        this.cameraLatitude = this.location.lat;
        this.cameraLongitude = this.location.lng;
        this.zoom = 17;
        cliente.latitud = this.location.lat;
        cliente.longitud = this.location.lng;
        this.clientes.splice(0, 1);
        this.draggable = true;
        this.cdr.detectChanges();
        this.clientes.push(cliente);
        this.cdr.detectChanges();
      }
      else{
        cliente.ingresado = false;
        this.location = { "lat": cliente.latitud, "lng": cliente.longitud };
        this.draggable = true;
        this.cdr.detectChanges();
      }
    });
  }

  onClickGeocodificarModal(){
    this.onEnterDireccion(this.direc);
  }

  onClickAceptarModal(){
    this.showModalAceptar = false;
    this.zoom = 15;
    this.onEnterCliente(this.cli);
  }

  onClickReGeocodificar(){
    var clienteGeo = this.clientes[0];
    this.clientes = [];
    this.rutas = [];
    this.rutasCant = [];

    this.clientes.push(clienteGeo);
    this.onEnterDireccion(this.direc);
  }

  onClickMostrarTodos(){
    this.draggable = false;
    this.direc = '';
    this.clientes = [];
    this.clientesCluster = [];
    this.cli = "Todos";
    this.geocodeMode = false;
    this.showLoader = true;
    this.showModalClose = false;
    this.showModalGeo = false;
    this.modalText = "Cargando clientes. Espere por favor...";
    this.modalTextColor = 0;
    this.rutas = [];
    this.rutasCant = [];

    //Mostrar el modal para el progreso de búsqueda
    document.getElementById("progressModalBtnOpen").click();
    this.cdr.detectChanges();

    this.roadshowService.getClientes().subscribe(res => {
      if (res)
        if(this.isAgrupado)
          this.clientesCluster = res.clientes;
        else
          this.clientes = res.clientes;

      console.log(this.clientes);
      setTimeout(() => {
        //Cierra el modal de progreso
        this.showLoader = false;
        document.getElementById("progressModalBtnClose").click();
        this.cdr.detectChanges();
      }, 6000);
    }, err => {
      console.log(err);
      this.showLoader = false;
      this.showModalClose = true;
      this.showModalGeo = false;
      this.modalText = "Hubo un error al consultar los datos.";
      this.cdr.detectChanges();
    });
  }

  onClickAgrupar(){
    var clientesArray;
    this.isAgrupado = !this.isAgrupado;
    console.log(this.isAgrupado);

    if (this.clientes.length > 0 || this.clientesCluster.length > 0) {
      if (this.isAgrupado){
        clientesArray = this.clientes.splice(0, this.clientes.length);
        this.cdr.detectChanges();

        //Mostrar el modal para el progreso de búsqueda
        this.showLoader = true;
        document.getElementById("progressModalBtnOpen").click();
        this.cdr.detectChanges();

        setTimeout(() => {
          //Cierra el modal de progreso
          this.showLoader = false;
          document.getElementById("progressModalBtnClose").click();
          this.clientesCluster = clientesArray;
          this.cdr.detectChanges();
        }, 10000);
      }
    }
  }

  //Método que hace un post al webservice y updatea la base
  onClickGrabarCoordenadas(){
    document.getElementById("progressModalBtnOpen").click();
    var suc = this.sucursales[this.posSucursal];
    this.roadshowService.postCoordenadasCliente(this.cli, suc, this.location).subscribe(res => {
      this.showModalGeo = false;
      this.showModalClose = false;
      this.showLoader = false;
      this.showModalAceptar = true;
      this.geocodeMode = false;
      console.log(res);

      if(res == 1) {
        this.modalText = "El cliente ha sido geocodificado exitosamente.";
        this.modalTextColor = 1;
      }
      else {
        this.modalText = "El cliente no se ha podido geocodificar.";
        this.modalTextColor = 0;
      }
    });
  }

  onClickSucursal(pos){
    this.sucursal = this.sucursalesN[pos];
    this.posSucursal = pos;
  }

  //Muestra la info del cliente seleccionado en la lista de clientes
  onClickCliente(i){
    if(this.posCliSelect)
      this.clientes[this.posCliSelect].ingresado = false;

    this.posCliSelect = i;

    //if(this.infoWindowActiva)
    //  this.infoWindowActiva.close();

    this.clientes[i].ingresado = true;
    console.log(this.clientes[i]);
  }

  //Despliega el menú de rutas y cierra el de clientes
  onClickRutas(){
    this.showClientes = false;
    setTimeout(() => {
      this.showRutas = true;
    }, 800);
  }

  //Despliega el menú de clientes y cierra el de rutas
  onClickClientes(){
    this.showRutas = false;
    setTimeout(() => {
      this.showClientes = true;
    }, 800);
  }

  onRadioChange(value){
    this.radio = value;
    console.log(this.radio);
    if(this.radio <= 0.5){
      this.zoom = 17;
    }
    else if(this.radio <= 1){
      this.zoom = 16;
    }
    else if(this.radio <= 1.5){
      this.zoom = 15;
    }else if(this.radio <= 2){
      this.zoom = 14;
    }

    if(this.cli != "")
      this.onEnterCliente(this.cli);
  }

  onRadioDrag(value){
    this.radio = value;
    console.log(this.radio);
  }

  determinarClienteSolapados(){
    var clientesUbicacion = {};
    this.clientesSolapados = [];

    for(var index in this.clientes){
      var key = "" + this.clientes[index].latitud + "," + this.clientes[index].longitud;
      if(!clientesUbicacion[key])
        clientesUbicacion[key] = [];
      clientesUbicacion[key].push(this.clientes[index]);
    }

    for(var s in clientesUbicacion){
      if(clientesUbicacion[s].length > 1)
        this.clientesSolapados.push(clientesUbicacion[s]);
    }

    console.log(this.clientesSolapados);
  }

}
