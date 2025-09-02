import { Directive, OnInit, HostBinding, HostListener, ElementRef } from '@angular/core';

import { Subject, filter } from 'rxjs';

@Directive({
  selector: '[appCellReadonlyHandler]'
})
export class CellReadonlyDirective implements OnInit {

  @HostBinding('readonly') readonly: boolean = true;

  @HostListener('dblclick', ['$event.target']) onDblclick(): void {
    this.readonly = false;
  }

  @HostListener('blur', ['$event.target']) onBlur(): void {
    this.blur$.next();
  }

  @HostListener('keyup.enter', ['$event.target']) onEnter(): void {
    this.blur$.next();
  }

  @HostListener('keyup.escape', ['$event.target']) onEscape(): void {
    this.blur$.next();
  }

  private readonly blur$: Subject<void> = new Subject();

  constructor(private elRef: ElementRef) {
  }

  ngOnInit(): void {
    this.blur$
      .asObservable()
      .pipe(
        filter(() => !this.readonly)
      )
      .subscribe(
        () => {
          this.readonly = true;
          this.elRef.nativeElement.blur();
        }
      );
  }
}
