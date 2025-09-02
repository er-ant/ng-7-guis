import { Component, ChangeDetectionStrategy,  OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import { ReplaySubject, takeUntil } from 'rxjs';

import { departureEalierReturnValidator } from './departure-earlier-return.validator';
import { IWay } from './data.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {

  readonly wayOptions: Array<IWay> = [
    {
      value: "one",
      label: "one-way flight"
    }, {
      value: "return",
      label: "return flight"
    }
  ];

  bookingForm: FormGroup;

  private readonly dateFieldValidators = [
    Validators.required, Validators.pattern(/(\d){2}\.(\d){2}\.(\d){1,5}$/)
  ];

  private readonly unsubscribe$: ReplaySubject<void> = new ReplaySubject<void>(1);

  constructor(private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onBook(): void {
    const way: string = this.bookingForm.get('way')?.value;
    const wayLabel = this.wayOptions.find((item: IWay) => item.value === way)?.label;
    const departureDate: string = this.bookingForm.get('departureDate')?.value;
    const returnDate: string = this.bookingForm.get('returnDate')?.value;
    let message: string = `You have booked a ${wayLabel}`;

    if (way === 'one') {
      message += ` on ${departureDate}.`;
    } else {
      message += `, departing on ${departureDate} & returning on ${returnDate}.`;
    }

    alert(message);
  }

  private buildForm(): void {
    this.bookingForm = this.fb.group({
      way: ['one'],
      departureDate: ['25.12.1999', this.dateFieldValidators],
      returnDate: [{ value: '25.12.1999', disabled: true }, this.dateFieldValidators]
    }, {
      validators: [departureEalierReturnValidator()],
    });

    this.bookingForm
      .get('way')?.valueChanges
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (value: string) => {
          const returnDate: FormControl = this.bookingForm.get('returnDate') as FormControl;
          if (value === 'one') {
            returnDate.disable();
          } else {
            returnDate.enable();
          }
        }
      );
  }
}
