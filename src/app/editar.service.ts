import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, zip } from 'rxjs';

import { map } from 'rxjs/operators';

const CREATE_ACTION = 'create';
const UPDATE_ACTION = 'update';
const REMOVE_ACTION = 'destroy';

const itemIndex = (item: any, data: any[]): number => {
    for (let idx = 0; idx < data.length; idx++) {
        if (data[idx].id_perfiles === item.id_perfiles) {
            return idx;
        }
    }

    return -1;
};

const cloneData = (data: any[]) => data.map(item => Object.assign({}, item));

@Injectable({
  providedIn: 'root'
})
export class EditarService extends BehaviorSubject<any[]> {

  private data: any[] = [];
  private originalData: any[] = [];
  private createdItems: any[] = [];
  private updatedItems: any[] = [];
  private deletedItems: any[] = [];

  private url = 'http://localhost:3000';

  constructor(private http: HttpClient) {
      super([]);
  }

  public read() {
    if (this.data.length) {
        return super.next(this.data);
    }

    this.fetchCrud().subscribe(data => {
      this.data = data;
      this.originalData = cloneData(data);
      super.next(data);
    });

    // this.fetch()
    //     .subscribe(data => {
    //         this.data = data;
    //         this.originalData = cloneData(data);
    //         super.next(data);
    //     });
  }

  public create(item: any): void {
      this.createdItems.push(item);
      this.data.unshift(item);
  
      super.next(this.data);
  }

  public update(item: any): void {
      if (!this.isNew(item)) {
          const index = itemIndex(item, this.updatedItems);
          if (index !== -1) {
              this.updatedItems.splice(index, 1, item);
          } else {
              this.updatedItems.push(item);
          }
      } else {
          const index = this.createdItems.indexOf(item);
          this.createdItems.splice(index, 1, item);
      }
  }

  public remove(item: any): void {
      console.log(item);
      let index = itemIndex(item, this.data);
      console.log(index);
      this.data.splice(index, 1);
  
      index = itemIndex(item, this.createdItems);
      if (index >= 0) {
          this.createdItems.splice(index, 1);
      } else {
          this.deletedItems.push(item);
      }
  
      index = itemIndex(item, this.updatedItems);
      if (index >= 0) {
          this.updatedItems.splice(index, 1);
      }
  
      super.next(this.data);
  }
  
  public isNew(item: any): boolean {
      return !item.id_perfiles;
  }
  
  public hasChanges(): boolean {
      return Boolean(this.deletedItems.length || this.updatedItems.length || this.createdItems.length);
  }
  
  public saveChanges(): void {
      if (!this.hasChanges()) {
          return;
      }
  
      const completed = [];
      if (this.deletedItems.length) {
          console.log(this.deletedItems);
        //   completed.push(this.fetch(REMOVE_ACTION, this.deletedItems));
          completed.push(this.fetchCrud(3, this.deletedItems));
        //   this.fetchCrud(3, this.deletedItems).subscribe();
      }
  
      if (this.updatedItems.length) {
          completed.push(this.fetchCrud(2, this.updatedItems));
        //   this.fetchCrud(2, this.updatedItems).subscribe();
      }
  
      if (this.createdItems.length) {
        //   this.fetchCrud(1, this.createdItems).subscribe();
          completed.push(this.fetchCrud(1, this.createdItems));
      }
  
      this.reset();
  
      zip(...completed).subscribe(() => this.read());
  }
  
  public cancelChanges(): void {
      this.reset();
  
      this.data = this.originalData;
      this.originalData = cloneData(this.originalData);
      super.next(this.data);
  }
  
  public assignValues(target: any, source: any): void {
    //   console.log(target.id_region, source);
      Object.assign(target, source);
  }
  
  private reset() {
      this.data = [];
      this.deletedItems = [];
      this.updatedItems = [];
      this.createdItems = [];
  }
  
  private fetch(action: string = '', data?: any): Observable<any[]> {
      return this.http
          .jsonp(`https://demos.telerik.com/kendo-ui/service/Products/${action}?${this.serializeModels(data)}`, 'callback')
          .pipe(map(res => res as any[]));
  }

  private fetchCrud(opcion: number = 0, data?: any) {
      let body;
      switch (opcion) {
          case 0:
              return this.http.get(this.url + '/perfiles').pipe(map((res: any) => res.perfiles));
              break;
          case 1:
              body = {
                datos: this.serializeModels1(data)
              };
              return this.http.post(this.url + '/perfiles', body).pipe(map((res: any) => res.perfiles));
              break;
          case 2:
              body = {
                datos: this.serializeModels1(data)
              };
              return this.http.post(this.url + '/modificarPerfiles', body).pipe(map((res: any) => res.perfiles));
              break;
          case 3:
              body = {
                datos: this.serializeModels1(data)
              }; 
              return this.http.post(this.url + '/eliminarPerfiles', body).pipe(map((res: any) => res.perfiles));
              break;
          default:
              break;
      }

  }
  
  private serializeModels(data?: any): string {
      return data ? `&models=${JSON.stringify(data)}` : '';
  }

  private serializeModels1(data?: any) {
    return JSON.parse(JSON.stringify(data));
  }

  getRegiones() {
      return this.http.get(this.url + '/catRegiones')
        .pipe(map((res: any) => res.regiones ));
  }

  getPerfiles() {
    return this.http.get(this.url + '/perfiles').pipe(map((res: any) => res.perfiles));
  }
}
