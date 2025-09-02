import { AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

export function departureEalierReturnValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value?.departureDate && control.value?.returnDate) {
      return inputValueToDate(control.value?.returnDate) < inputValueToDate(control.value?.departureDate) ? 
        { departureEarlierReturn: true } :
        null;
    }

    return null;
  }
}

function inputValueToDate(value: string): Date {
  const split: Array<string> = value.split('.');
  const [day, month, year]: [string, string, string] = split as [string, string, string];

  return new Date(`${year}-${month}-${day}`);
}
