import { Observable } from 'rxjs';
import { Component, OnInit, Inject } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

import { GridDataResult } from '@progress/kendo-angular-grid';
import { State, process } from '@progress/kendo-data-query';

import { Product } from '../../perfiles';
import { EditarService } from '../../editar.service';

import { map } from 'rxjs/operators';

import { SnotifyPosition, SnotifyService, SnotifyToastConfig } from 'ng-snotify';

@Component({
  selector: 'app-tabla-perfiles',
  templateUrl: './tabla-perfiles.component.html',
  styleUrls: ['./tabla-perfiles.component.css']
})
export class TablaPerfilesComponent implements OnInit {

    // configuracion notificaciones
    style = 'material';
    title = 'Snotify title!';
    body = 'Lorem ipsum dolor sit amet!';
    timeout = 3000;
    position: SnotifyPosition = SnotifyPosition.rightTop;
    progressBar = true;
    closeClick = true;
    newTop = true;
    filterDuplicates = false;
    backdrop = -1;
    dockMax = 8;
    blockMax = 6;
    pauseHover = true;
    titleMaxLength = 15;
    bodyMaxLength = 80;

    public datosRegiones: any[];
    public datosPerfiles: any[];
    public valorRegion = 1;
    regionMod = false;
    // public formGroups: FormGroup = new FormGroup({ items: new FormArray([])});
    public view: Observable<GridDataResult>;
    public gridState: State = {
        sort: [],
        skip: 0,
        take: 10
    };

    public changes: any = {};

    constructor(private formBuilder: FormBuilder, 
                public editService: EditarService,
                private snotifyService: SnotifyService) {
        this.editService.getRegiones().subscribe((regiones: any) => {
            this.datosRegiones = regiones;
        });
    }

    public ngOnInit(): void {
        this.editService.getPerfiles().subscribe((data: any) => {
            this.datosPerfiles = data;
        })

        this.view = this.editService.pipe(map(data => process(data, this.gridState)));

        this.editService.read();
    }

    getConfig(): SnotifyToastConfig {
        this.snotifyService.setDefaults({
          global: {
            newOnTop: this.newTop,
            maxAtPosition: this.blockMax,
            maxOnScreen: this.dockMax,
            // @ts-ignore
            filterDuplicates: this.filterDuplicates
          }
        });
        return {
          bodyMaxLength: this.bodyMaxLength,
          titleMaxLength: this.titleMaxLength,
          backdrop: this.backdrop,
          position: this.position,
          timeout: this.timeout,
          showProgressBar: this.progressBar,
          closeOnClick: this.closeClick,
          pauseOnHover: this.pauseHover
        };
      }

    public onStateChange(state: State) {
        this.gridState = state;

        this.editService.read();
    }

    public obtenregion(id: number){
        const reg = this.datosRegiones.find(x => x.id_region === id);
        return reg.region;
    }

    public obtenregionId(id: number){
        const reg = this.datosPerfiles.find(x => x.id_perfiles === id);
        return reg.id_region;
    }

    cambioRegion(e) {
        // console.log(e);
        // this.valorRegion = e;
        this.regionMod = true;

    }

    public cellClickHandler({ sender, rowIndex, columnIndex, dataItem, isEdited }) {
        // console.log(dataItem.id_perfiles);
        const num = this.obtenregionId(dataItem.id_perfiles);
        this.valorRegion = num;
        if (!isEdited) {
            sender.editCell(rowIndex, columnIndex, this.createFormGroup(dataItem));
        }
    }

    public cellCloseHandler(args: any) {
        // console.log('cerro');
        const { formGroup, dataItem } = args;
        if (this.regionMod) {
            console.log(this.valorRegion);
            formGroup.value.id_region = dataItem.id_region;
        }

        if (!formGroup.valid) {
            // for (const key in formGroup.controls) {
            //     if (Object.prototype.hasOwnProperty.call(formGroup.controls, key)) {
            //         const element = formGroup.controls[key];
            //         if (element.invalid ) {
            //             console.log(element);
            //         }
                    
            //     }
            // }
             // prevent closing the edited cell if there are invalid values.
            
            this.snotifyService.error('¡Formato del campo invalido!', 'Error', this.getConfig());
            
            args.preventDefault();
        } else if (formGroup.dirty || this.regionMod) {
            // console.log(dataItem.id_region, dataItem);
            this.editService.assignValues(dataItem, formGroup.value);
            this.editService.update(dataItem);
            this.regionMod = false;
        }
    }

    public addHandler({ sender }) {
        sender.addRow(this.createFormGroup(new Product()));
    }

    public cancelHandler({ sender, rowIndex }) {
        sender.closeRow(rowIndex);
    }

    public saveHandler({ sender, formGroup, rowIndex }) {
        if (formGroup.valid) {
            this.editService.create(formGroup.value);
            sender.closeRow(rowIndex);
        }
    }

    public removeHandler({ sender, dataItem }) {
        this.editService.remove(dataItem);

        sender.cancelCell();
    }

    public saveChanges(grid: any): void {
        grid.closeCell();
        grid.cancelCell();

        this.editService.saveChanges();
    }

    public cancelChanges(grid: any): void {
        grid.cancelCell();

        this.editService.cancelChanges();
    }

    public createFormGroup(dataItem: any): FormGroup {
        return this.formBuilder.group({
            'id_perfiles': dataItem.id_perfiles,
            'numero_empleado': dataItem.numero_empleado,
            'nombre': [dataItem.nombre, Validators.required],
            'puesto': dataItem.puesto,
            'email_contacto': [dataItem.email_contacto, Validators.email],
            'telefono_celular': [dataItem.telefono_celular, Validators.minLength(10)],
            'telefono_fijo': dataItem.telefono_fijo,
            'extencion': dataItem.extencion,
            'zona': dataItem.zona,
            'id_region': dataItem.id_region,
            'region': dataItem.region
        });
    }

}
