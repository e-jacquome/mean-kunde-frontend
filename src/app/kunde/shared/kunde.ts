/* eslint-disable */

const MIN_KATEGORIE = 0;
const MAX_KATEGORIE = 9;

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  CHF = 'CHF',
  GBP = 'GBP',
  JPY = 'JPY',
}

export enum GeschlechtType {
  M = 'MAENNLICH',
  W = 'WEIBLICH',
  D = 'DIVERS',
}

export enum FamilienstandType {
  L = 'LEDIG',
  VH = 'VERHEIRATET',
  G = 'GESCHIEDEN',
  VW = 'VERWITWET',
}

export enum InteresseType {
  S = 'SPORT',
  L = 'LESEN',
  R = 'REISEN',
}

export class Umsatz {
  public constructor(public betrag: number, public waehrung: Currency) {
    this.betrag = betrag;
    this.waehrung = waehrung;
  }
}

export class Adresse {
  public constructor(public plz: number, public ort: string) {
    this.plz = plz;
    this.ort = ort;
  }
}

export class Kunde {
  geburtsdatum: Date | undefined;

  // eslint-disable-next-line max-params
  private constructor(
    // tslint:disable-next-line: variable-name
    public _id: string | undefined,
    public version: number | undefined,
    public nachname: string,
    public email: string,
    public kategorie: number,
    public newsletter: boolean,
    geburtsdatum: string | undefined,
    public umsatz: Umsatz | undefined,
    public homepage: string | undefined,
    public geschlecht: GeschlechtType | undefined,
    public familienstand: FamilienstandType | undefined,
    public interessen: Array<InteresseType> | undefined,
    public adresse: Adresse,
    public username: string | undefined
  ) {
    this.geburtsdatum =
      geburtsdatum === undefined ? new Date() : new Date(geburtsdatum);
    console.log('Kunde(): this=', this);
  }

  static fromServer(kundeServer: KundeServer, etag?: string) {
    let selfLink: string | undefined;
    const { _links } = kundeServer;
    if (_links !== undefined) {
      const { self } = _links;
      selfLink = self.href;
    }
    let id: string | undefined;
    if (selfLink !== undefined) {
      const lastSlash = selfLink.lastIndexOf('/');
      id = selfLink.substring(lastSlash + 1);
    }

    let version: number | undefined;
    if (etag !== undefined) {
      const versionStr = etag.substring(1, etag.length - 1);
      version = Number.parseInt(versionStr, 10);
    }

    const kunde = new Kunde(
      id,
      kundeServer.version,
      kundeServer.nachname,
      kundeServer.email,
      kundeServer.kategorie,
      kundeServer.newsletter,
      kundeServer.geburtsdatum,
      kundeServer.umsatz,
      kundeServer.homepage,
      kundeServer.geschlecht,
      kundeServer.familienstand,
      kundeServer.interessen,
      kundeServer.adresse,
      kundeServer.username
    );
    console.log('Kunde.fromServer(): kunde=', kunde);
    return kunde;
  }

  containsNachname(nachname: string) {
    return this.nachname === undefined
      ? false
      : this.nachname.toLowerCase().includes(nachname.toLowerCase());
  }

  hasInteressen() {
    if (this.interessen === undefined || this.interessen === null) {
      return false;
    }
    return this.interessen;
  }

  hasInteresse(interesse: string) {
    if (this.interessen === undefined) {
      return false;
    }
    interesse = interesse.toUpperCase();
    let interesseType;
    switch (interesse) {
      case 'SPORT': {
        interesseType = InteresseType.S;
        break;
      }
      case 'LESEN': {
        interesseType = InteresseType.L;
        break;
      }
      case 'REISEN': {
        interesseType = InteresseType.R;
        break;
      }
    }
    return this.interessen.includes(interesseType);
  }
}

export class User {
  username: string;
  password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
}

// gemeinsame Properties
export interface KundeShared {
  _id?: string;
  nachname?: string;
  email?: string;
  kategorie?: number;
  newsletter?: boolean;
  geburtsdatum?: string;
  umsatz?: Umsatz;
  homepage?: string;
  geschlecht?: GeschlechtType;
  familienstand?: FamilienstandType;
  interessen?: Array<string>;
  adresse?: Adresse;
  user?: User;
  version?: number;
}

export interface KundeCreate {
  _id?: string;
  nachname?: string;
  email?: string;
  kategorie?: number;
  newsletter?: boolean;
  geburtsdatum?: string;
  umsatz?: Umsatz;
  homepage?: string;
  geschlecht?: string;
  familienstand?: string;
  interessen?: Array<string>;
  adresse?: Adresse;
  user?: User;
  version?: number;
}

export interface KundeServer extends KundeShared {
  username: string;
  interessen?: Array<InteresseType>;
  _links?: {
    self: Link;
    list?: Link;
    add?: Link;
    update?: Link;
    remove?: Link;
  };
}

interface Link {
  href: string;
}
