import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { interval, Subject, ReplaySubject, merge, iif, empty } from 'rxjs';
import { takeWhile, filter, switchMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {

  activeTime: number = 0;
  duration: number = 1;

  private readonly reset$: Subject<void> = new Subject();
  private readonly valueChanged$: Subject<void> = new Subject();

  private readonly unsubscribe$: ReplaySubject<void> = new ReplaySubject<void>(1);

  constructor(private cdRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.initInterval();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private initInterval(): void {
    merge(
      this.reset$,
      this.valueChanged$
    )
      .pipe(
        switchMap(() => {
          return this.activeTime < this.duration ? 
            interval(100).pipe(takeWhile(() => this.activeTime < this.duration)) : 
            empty();
        }),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (time: number) => {
          this.activeTime = Math.round((this.activeTime + 0.1) * 100) / 100;
          this.cdRef.markForCheck();
        }
      );
  }

  onDurationChanged($event: number): void {
    this.duration = $event || 1;
    this.valueChanged$.next();
  }

  onReset(): void {
    this.activeTime = 0;
    this.reset$.next();
  }
}
