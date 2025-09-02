import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  cTemp: number | null;
  fTemp: number | null;

  tempCCalculation($event: number | null): void {
    this.cTemp = $event;
    
    if (this.cTemp === null) {
      this.fTemp = null;
      return;
    }

    this.fTemp = Number((this.cTemp * (9 / 5) + 32).toFixed(2));
  }

  tempFCalculation($event: number | null): void {
    this.fTemp = $event;

    if (this.fTemp === null) {
      this.cTemp = null;
      return;
    }

    this.cTemp = Number(((this.fTemp - 32) * (5 / 9)).toFixed(2));
  }
}
