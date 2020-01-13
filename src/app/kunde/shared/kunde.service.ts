/* eslint-disable max-lines-per-function */
/* eslint-disable */
import {
    HttpClient,
    HttpErrorResponse,
    HttpParams,
} from '@angular/common/http';
  import { Injectable } from '@angular/core';
  import { Subject } from 'rxjs';
  import { filter, map } from 'rxjs/operators';
  import { BASE_URI } from '../../shared';
  import { DiagrammService } from '../../shared/diagramm.service';
  import { GeschlechtType, Kunde, KundeCreate, KundeServer } from './kunde';
  
  @Injectable({ providedIn: 'root' })
  export class KundeService {
    /* eslint-disable no-underscore-dangle */
    readonly kundenSubject = new Subject<Array<Kunde>>();
    readonly kundeSubject = new Subject<Kunde>();
    readonly locationSubject = new Subject<string>();
    readonly errorSubject = new Subject<string | number>();
  
    private readonly baseUriKunden!: string;
  
    // tslint:disable-next-line: variable-name
    private _kunde!: Kunde;
  
    constructor(
      private readonly httpClient: HttpClient,
      private readonly diagrammService: DiagrammService
    ) {
      this.baseUriKunden = `${BASE_URI}`;
      console.log(
        `KundeService.constructor(): baseUriKunde=${this.baseUriKunden}`
      );
    }
  
    set kunde(kunde: Kunde) {
      console.log('KundeService.set kunde()', kunde);
      this._kunde = kunde;
    }
  
    create(kunde: KundeCreate) {
      console.log('KundeService.create(): KundeObject=', JSON.stringify(kunde));
      this.httpClient
        .post(this.baseUriKunden, kunde, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/plain',
          },
          observe: 'response',
          responseType: 'text',
        })
        .pipe(
          map(response => {
            console.log('KundeService.save(): map(): response', response);
            const { headers } = response;
            let location: string | null | undefined = headers.get('Location');
            if (location === null) {
              location = undefined;
            }
            return location;
          })
        )
        .subscribe(location => this.locationSubject.next(location));
    }
    find(suchkriterien: Suchkriterien) {
      console.log('KundeService.find(): suchkriterien=', suchkriterien);
      const params = this.suchkriterienToHttpParams(suchkriterien);
      const uri = this.baseUriKunden;
      console.log(`KundeService.find(): uri=${uri}`);
  
      const errorFn = (err: HttpErrorResponse) => {
        if (err.error instanceof ProgressEvent) {
          console.error('Client-seitiger oder Netzwerkfehler', err.error);
          this.errorSubject.next(-1);
          return;
        }
  
        const { status } = err;
        console.log(
          `KundeService.find(): errorFn(): status=${status}, ` + 'Response-Body=',
          err.error
        );
        this.errorSubject.next(status);
      };
  
      return this.httpClient
        .get<Array<KundeServer>>(uri, { params })
        .pipe(
          map(jsonArray => {
            if (Array.isArray(jsonArray)) {
              return jsonArray.map(jsonObjekt => Kunde.fromServer(jsonObjekt));
            }
            return [Kunde.fromServer(jsonArray)];
          })
        )
        .subscribe(kunden => this.kundenSubject.next(kunden), errorFn);
    }
  
    // eslint-disable-next-line max-lines-per-function
    findById(id: string | undefined) {
      console.log(`KundeService.findById(): id=${id}`);
  
      if (
        this._kunde !== undefined &&
        this._kunde._id === id &&
        this._kunde.version !== undefined
      ) {
        console.log(
          `KundeService.findById(): Kunde gepuffert, version=${this._kunde.version}`
        );
        this.kundeSubject.next(this._kunde);
        return;
      }
      if (id === undefined) {
        console.log('KundeService.findById(): Keine Id');
        return;
      }
  
      const uri = `${this.baseUriKunden}/${id}`;
  
      const errorFn = (err: HttpErrorResponse) => {
        if (err.error instanceof ProgressEvent) {
          console.error(
            'KundeService.findById(): errorFn(): Client- oder Netzwerkfehler',
            err.error
          );
          this.errorSubject.next(-1);
          return;
        }
  
        const { status } = err;
        console.log(
          `KundeService.findById(): errorFn(): status=${status}` +
            `Response-Body=${err.error}`
        );
        this.errorSubject.next(status);
      };
  
      console.log('KundeService.findById(): GET-Request');
  
      let body: KundeServer | null = null;
      let etag: string | null = null;
      return this.httpClient
        .get<KundeServer>(uri, { observe: 'response' })
        .pipe(
          filter(response => {
            // tslint:disable-next-line: no-console
            console.debug(
              'KundeService.findById(): filter(): response=',
              response
            );
            ({ body } = response);
            return body !== null;
          }),
          filter(response => {
            etag = response.headers.get('ETag');
            console.log(`etag = ${etag}`);
            return etag !== null;
          }),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          map(_ => {
            this._kunde = Kunde.fromServer(body, etag);
            return this._kunde;
          })
        )
        .subscribe(kunde => this.kundeSubject.next(kunde), errorFn);
    }
  
    /* eslint-enable max-lines-per-function */
    private suchkriterienToHttpParams(suchkriterien: Suchkriterien): HttpParams {
      console.log(
        'KundeService.suchkriterienToHttpParams(): suchkriterien=',
        suchkriterien
      );
      let httpParams = new HttpParams();
  
      const {
        nachname,
        email,
        familienstand,
        geschlecht,
        interessen,
      } = suchkriterien;
      const { l, r, s } = interessen;
  
      if (nachname !== undefined && nachname !== '') {
        httpParams = httpParams.set('nachname', nachname);
      }
      if (email !== undefined) {
        httpParams = httpParams.set('email', email);
      }
      if (geschlecht !== undefined) {
        httpParams = httpParams.set('geschlecht', geschlecht);
      }
      if (familienstand !== undefined && familienstand.length !== 0) {
        httpParams = httpParams.set('familienstand', familienstand);
      }
      if (l === true) {
        httpParams = httpParams.set('interessen', 'L');
      }
      if (r === true) {
        httpParams = httpParams.set('interessen', 'R');
      }
      if (s === true) {
        httpParams = httpParams.set('interessen', 'S');
      }
      return httpParams;
    }
  
    private setKundeId(kunde: KundeServer) {
      const { _links } = kunde;
      if (_links !== undefined) {
        const selfLink = kunde._links.self.href;
        if (typeof selfLink === 'string') {
          const lastSlash = selfLink.lastIndexOf('/');
          kunde._id = selfLink.substring(lastSlash + 1);
        }
      }
      if (kunde._id === undefined) {
        kunde._id = 'undefined';
      }
      return kunde;
    }
  
    remove(
      kunde: Kunde,
      successFn: (() => void) | undefined,
      errorFn: (status: number) => void
    ) {
      console.log('KundeService.remove(): kunde=', kunde);
      const uri = `${this.baseUriKunden}/${kunde._id}`;
  
      const errorFnDelete = (err: HttpErrorResponse) => {
        if (err.error instanceof Error) {
          console.error('Client-seitiger oder Netzwerkfehler', err.error.message);
        } else if (errorFn === undefined) {
          console.error('errorFnPut', err);
        } else {
          errorFn(err.status);
        }
      };
  
      return this.httpClient.delete(uri).subscribe(successFn, errorFnDelete);
    }
  // eslint-disable-next-line max-lines-per-function
    createLinearChart(chartElement: HTMLCanvasElement) {
      console.log('KundeService.createLinearChart()');
      const uri = this.baseUriKunden;
  
      return this.httpClient
        .get<Array<KundeServer>>(uri)
        .pipe(
          map(kunden => kunden.map(k => this.setKundeId(k))),
          // eslint-disable-next-line max-lines-per-function
          map(kunden => {
            const kundenGueltig = kunden.filter(
              k =>
                k._id !== null &&
                k.geschlecht !== undefined &&
                k.geschlecht !== null
            );
            // const labels = kundenGueltig.map(k => k._id);
            const labels = new Array<string>();
            labels.push('Maennlich');
            labels.push('Weiblich');
            labels.push('Diverse');
            console.log('KundeService.createLinearChart(): labels: ', labels);
  
            let sexM = 0;
            let sexW = 0;
            let sexD = 0;
            kundenGueltig.forEach(k => {
              switch (k.geschlecht.toString()) {
                case 'M': {
                  ++sexM;
                  break;
                }
                case 'W': {
                  ++sexW;
                  break;
                }
                case 'D': {
                  ++sexD;
                  break;
                }
              }
            });
            const sexes = new Array<number>();
            sexes.push(sexM);
            sexes.push(sexW);
            sexes.push(sexD);
  
            const data: Chart.ChartData = {
              labels,
              datasets: [
                {
                  label: 'Bewertung',
                  data: sexes,
                  lineTension: 0,
                },
              ],
            };
  
            return {
              type: 'line',
              options: {
                legend: { display: false },
                elements: { line: { borderColor: 'FFFFFF' } },
                scales: {
                  yAxes: [
                    {
                      ticks: {
                        beginAtZero: true,
                      },
                    },
                  ],
                },
              },
              data,
            };
          })
        )
        .subscribe(config =>
          this.diagrammService.createChart(chartElement, config)
        );
    }
  
    // eslint-disable-next-line max-lines-per-function
    createBarChart(chartElement: HTMLCanvasElement) {
      console.log('KundeService.createBarChart()');
      const uri = this.baseUriKunden;
      return this.httpClient
        .get<Array<KundeServer>>(uri)
        .pipe(
          map(kunden => kunden.map(kunde => this.setKundeId(kunde))),
          // eslint-disable-next-line max-lines-per-function
          map(kunden => {
            const kundenGueltig = kunden.filter(
              k => k.geschlecht !== undefined && k.geschlecht !== null
            );
            const labels = Array<string>();
            labels.push('Maennlich');
            labels.push('Weiblich');
            labels.push('Diverse');
            console.log('KundeService.createBarChart(): labels: ', labels);
  
            let sexM = 0;
            let sexW = 0;
            let sexD = 0;
            kundenGueltig.forEach(k => {
              switch (k.geschlecht.toString()) {
                case 'M': {
                  ++sexM;
                  break;
                }
                case 'W': {
                  ++sexW;
                  break;
                }
                case 'D': {
                  ++sexD;
                  break;
                }
              }
            });
            const sexes = new Array<number>();
            sexes.push(sexM);
            sexes.push(sexW);
            sexes.push(sexD);
  
            const anzahl = sexes.length;
            const backgroundColor = new Array<string>(anzahl);
            const hoverBackgroundColor = new Array<string>(anzahl);
            Array(anzahl)
              .fill(true)
              .forEach((_, i) => {
                backgroundColor[i] = this.diagrammService.getBackgroundColor(i);
                hoverBackgroundColor[
                  i
                ] = this.diagrammService.getHoverBackgroundColor(i);
              });
  
            const data: Chart.ChartData = {
              labels,
              datasets: [
                {
                  // label: '',
                  data: sexes,
                  backgroundColor,
                  hoverBackgroundColor,
                },
              ],
            };
  
            return {
              type: 'bar',
              options: {
                legend: { display: false },
                elements: { line: { borderColor: 'FFFFFF' } },
                scales: {
                  yAxes: [
                    {
                      ticks: {
                        beginAtZero: true,
                      },
                    },
                  ],
                },
              },
              data,
            };
          })
        )
        .subscribe(config =>
          this.diagrammService.createChart(chartElement, config)
        );
    }
  
    // eslint-disable-next-line max-lines-per-function
    createPieChart(chartElement: HTMLCanvasElement) {
      console.log('KundeService.createPieChart()');
      const uri = this.baseUriKunden;
  
      return this.httpClient
        .get<Array<KundeServer>>(uri)
        .pipe(
          map(kunden => kunden.map(kunde => this.setKundeId(kunde))),
          // eslint-disable-next-line max-lines-per-function
          map(kunden => {
            const kundenGueltig = kunden.filter(
              k =>
                k._id !== null &&
                k.geschlecht !== undefined &&
                k.geschlecht !== null
            );
            const labels = Array<string>();
            labels.push('Maennlich');
            labels.push('Weiblich');
            labels.push('Diverse');
            console.log('KundeService.createBarChart(): labels: ', labels);
  
            let sexM = 0;
            let sexW = 0;
            let sexD = 0;
            kundenGueltig.forEach(k => {
              switch (k.geschlecht.toString()) {
                case 'M': {
                  ++sexM;
                  break;
                }
                case 'W': {
                  ++sexW;
                  break;
                }
                case 'D': {
                  ++sexD;
                  break;
                }
              }
            });
            const sexes = new Array<number>();
            sexes.push(sexM);
            sexes.push(sexW);
            sexes.push(sexD);
  
            const anzahl = sexes.length;
            const backgroundColor = new Array<string>(anzahl);
            const hoverBackgroundColor = new Array<string>(anzahl);
            Array(anzahl)
              .fill(true)
              .forEach((_, i) => {
                backgroundColor[i] = this.diagrammService.getBackgroundColor(i);
                hoverBackgroundColor[
                  i
                ] = this.diagrammService.getHoverBackgroundColor(i);
              });
  
            const data: Chart.ChartData = {
              labels,
              datasets: [
                {
                  data: sexes,
                  backgroundColor,
                  hoverBackgroundColor,
                },
              ],
            };
  
            return { type: 'pie', data };
          })
        )
        .subscribe(config =>
          this.diagrammService.createChart(chartElement, config)
        );
    }
  }
  
  export interface Suchkriterien {
    nachname: string;
    email: string;
    familienstand: string;
    geschlecht: string;
    interessen: { l: boolean; r: boolean; s: boolean };
  }
  