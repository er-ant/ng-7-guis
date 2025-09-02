import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { Subject, ReplaySubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { IClient } from './data.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {

  clients: Array<IClient> = [];
  displayedClients: Array<IClient> = [];

  selectedClient: IClient | null;
  filterValue: string;
  name: string;
  surname: string;

  private searchText$: Subject<string> = new Subject<string>();

  private readonly unsubscribe$: ReplaySubject<void> = new ReplaySubject<void>(1);

  ngOnInit(): void {
    this.initSearchSubscription();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  isClientUnique(): boolean {
    return !this.clients.some((client: IClient) => {
      return client.name === this.name && client.surname === this.surname;
    });
  }

  selectClient(client: IClient): void {
    this.selectedClient = client !== this.selectedClient ? client : null;
    
    if (this.selectedClient) {
      this.name = this.selectedClient.name;
      this.surname = this.selectedClient.surname;
    } else {
      this.name = '';
      this.surname = '';
    }
  }

  onFilterChanged($event: any): void {
    this.selectedClient = null;
    this.searchText$.next($event);
  }

  create(): void {
    if (this.isClientUnique()) {
      this.clients.push({
        id: this.clients.length + 1,
        name: this.name,
        surname: this.surname
      });

      this.name = '';
      this.surname = '';
      this.selectedClient = null;

      this.recheckDisplayedClients();
    }
  }

  update(): void {
    if (this.selectedClient && this.isClientUnique()) {
      this.selectedClient.name = this.name;
      this.selectedClient.surname = this.surname;
      this.name = '';
      this.surname = '';
      this.recheckDisplayedClients();
    }
  }

  delete(): void {
    if (this.selectedClient) {
      const clientIndex: number = this.clients.findIndex((client: IClient) => client.id === this.selectedClient?.id);
      this.clients.splice(clientIndex, 1);
      this.name = '';
      this.surname = '';
    }
  }

  private initSearchSubscription(): void {
    this.searchText$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (filterValue: string) => {
          this.filterValue = filterValue;
          this.recheckDisplayedClients();
        }
      );
  }

  private recheckDisplayedClients(): void {
    if (!this.filterValue) {
      this.displayedClients = this.clients;
      return;
    }
    this.displayedClients =
      this.clients.filter((client: IClient) => client.name.includes(this.filterValue) || client.surname.includes(this.filterValue));
  }
}
