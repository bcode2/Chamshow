import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

const url_roadshow_api = 'http://spk38/RoadshowService/WebService.asmx/';
const url_geocode_api = 'https://maps.googleapis.com/maps/api/geocode/json';
const apiKey = 'AIzaSyCk_QmOe4BTCWUkccQODdkejeJAZEfSL3E';

@Injectable({
  providedIn: 'root',
})
export class RoadshowService {

  API = {
    getClientes: url_roadshow_api             + 'Get_Clientes_Cercanos',
    getClientesTodos: url_roadshow_api        + 'Get_Clientes',
    getPedidosSETE: url_roadshow_api          + 'Get_Pedidos_Sete',
    getRutasSete: url_roadshow_api            + 'Get_Hoja_Ruta_Sete',
    getEmpleadosSETE: url_roadshow_api        + 'Get_Empleados_Sete',
    getDistancia: url_roadshow_api            + 'Get_Distance_Matrix',
    getLotes: url_roadshow_api                + 'Get_Lotes_Fecha',
    getRecorridoCamion: url_roadshow_api      + 'Get_Recorrido_Camion',
    getResumenCamion: url_roadshow_api        + 'Get_Resumen_Camion',
    getTrackingGPS: url_roadshow_api          + 'Get_Tracking_Gps',
    postCoordenadasCliente: url_roadshow_api  + 'Post_Coordenadas_Cliente',
    postPedidoEspecial: url_roadshow_api      + 'Post_Pedido_Especial',
    postRoadshowRuteo: url_roadshow_api       + 'Post_Roadshow_Ruteo'
  }

  constructor(private http: HttpClient) { }

  public getClientesCercanos(cliente, sucursal, radio) : any {
    var endpoint = this.API.getClientes;

    endpoint += "?cliente=" + cliente;
    endpoint += "&sucursal=" + sucursal;
    endpoint += "&radio=" + radio;
    endpoint += "&key=" + apiKey;

    return this.http.get(endpoint);
  }

  public getClientes() : any {
    var endpoint = this.API.getClientesTodos;

    endpoint += "?key=" + apiKey;

    return this.http.get(endpoint);
  }

  public getPedidosSETE() : any {
    var endpoint = this.API.getPedidosSETE;

    endpoint += "?key=" + apiKey;

    return this.http.get(endpoint);
  }

  public getRutasSETE(fecha, empleado) : any {
    var endpoint = this.API.getRutasSete;

    endpoint += "?fecha=" + fecha;
    endpoint += "&empleado=" + empleado;
    endpoint += "&key=" + apiKey;

    return this.http.get(endpoint);
  }

  public getEmpleadosSETE() : any {
    var endpoint = this.API.getEmpleadosSETE;

    endpoint += "?key=" + apiKey;

    return this.http.get(endpoint);
  }

  public getLotes(sucursal, fecha) : any {
    var endpoint = this.API.getLotes;

    endpoint += "?sucursal=" + sucursal;
    endpoint += "&fecha=" + fecha;
    endpoint += "&key=" + apiKey;

    return this.http.get(endpoint);
  }

  public getRecorridoCamion(sucursal, fecha, patente) : any {
    var endpoint = this.API.getRecorridoCamion;

    endpoint += "?sucursal=" + sucursal;
    endpoint += "&fecha=" + fecha;
    endpoint += "&patente=" + patente;
    endpoint += "&key=" + apiKey;

    return this.http.get(endpoint);
  }

  public getResumenCamion(fecha, patente) : any {
    var endpoint = this.API.getResumenCamion;

    endpoint += "?fecha=" + fecha;
    endpoint += "&patente=" + patente;
    endpoint += "&key=" + apiKey;

    return this.http.get(endpoint);
  }

  public getTrackingGPS() : any {
    var endpoint = this.API.getTrackingGPS;
    endpoint += "?key=" + apiKey;

    return this.http.get(endpoint);
  }

  public geocodificar(direccion) : any {
    var endpoint = url_geocode_api;

    endpoint += "?address=" + direccion;
    endpoint += "&key=" + apiKey;

    return this.http.get(endpoint);
  }

  public calcularDistancia(origen, destino, modo) : any {
    var endpoint = this.API.getDistancia;

    endpoint += "?origen=" + origen.latitud + "," + origen.longitud;
    endpoint += "&destino=" + destino.latitud + "," + destino.longitud;
    endpoint += "&modo=" + modo;
    endpoint += "&key=" + apiKey;

    console.log(endpoint);
    return this.http.get(endpoint);
  }

  public postCoordenadasCliente(cliente, sucursal, location) : any {
    var endpoint = this.API.postCoordenadasCliente;

    endpoint += "?cliente=" + cliente;
    endpoint += "&sucursal=" + sucursal;
    endpoint += "&latitud=" + location.lat;
    endpoint += "&longitud=" + location.lng;
    endpoint += "&key=" + apiKey;

    return this.http.get(endpoint);
  }

  public marcarPedidoEspecial(pedido, habilitado) : any {
    var endpoint = this.API.postPedidoEspecial;

    var json = {
      "prefijo": pedido.prefijo,
      "numero": pedido.numero,
      "habilitado": habilitado
    }

    const httpHeaders = {
      headers: new HttpHeaders({
        'Content-Type':  'application/x-www-form-urlencoded'
      })
    };

    console.log(endpoint);
    return this.http.post(endpoint, json, httpHeaders);
  }

  public grabarRuta(ruta) : any {
    var endpoint = this.API.postRoadshowRuteo;

    const httpHeaders = {
      headers: new HttpHeaders({
        'Content-Type':  'application/x-www-form-urlencoded'
      })
    };

    return this.http.post(endpoint, ruta, httpHeaders);
  }

}
