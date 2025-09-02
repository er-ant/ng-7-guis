import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, TemplateRef, OnInit, OnDestroy } from '@angular/core';

import { Subject, ReplaySubject } from 'rxjs';
import { tap, distinctUntilChanged, debounceTime, takeUntil } from 'rxjs/operators';

interface IStateItem {
  type: 'addCircle' | 'adjustDiameter';
  circle: SVGCircleElement;
  oldDiameter?: number;
  newDiameter?: number;
}

interface ISelected {
  circle: SVGCircleElement;
  diameter: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('svgArea', { read: ElementRef }) svgArea: ElementRef<SVGSVGElement>;

  circleDiameter: string = '15';

  state: Array<IStateItem> = [];
  actualStatePointer: number = 0;

  selectedCircle: ISelected | null;

  private readonly SVG_NAME_SPACE = 'http://www.w3.org/2000/svg';
  private diameterValueChanged$: Subject<number> = new Subject<number>();

  private unsubscribe$: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

  constructor(private cdRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.subscribeDiameterChanges();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true);
    this.unsubscribe$.complete();
  }

  undo(): void {
    this.actualStatePointer = this.actualStatePointer - 1;
    const stateItem: IStateItem = this.state[this.actualStatePointer];
    switch (stateItem.type) {
      case 'addCircle':
        this.removeCircle(stateItem.circle);
        break;

      case 'adjustDiameter':
        this.setRadius(stateItem.circle, (stateItem.oldDiameter! / 2).toString());
        break;
    }
  }

  redo(): void {
    const stateItem: IStateItem = this.state[this.actualStatePointer];

    switch (stateItem.type) {
      case 'addCircle':
        this.addCircle(stateItem.circle);
        break;

      case 'adjustDiameter':
        this.setRadius(stateItem.circle, (stateItem.newDiameter! / 2).toString());
        break;
    }

    this.actualStatePointer++;
  }

  svgAreaClickedHandler($event: MouseEvent): void {
    const coords: SVGPoint = this.mouseToSvgCoords($event);
    const circle: SVGCircleElement = this.createCircle(coords.x.toString(), coords.y.toString());

    this.addCircle(circle);
    this.state.push({
      type: 'addCircle',
      circle
    });

    this.actualStatePointer = this.state.length;
  }

  setDiameter($event: number): void {
    this.diameterValueChanged$.next($event);
  }

  hideForm(): void {
    this.selectedCircle!.circle.classList.remove('selected');
    this.selectedCircle = null;
    this.cdRef.detectChanges();
  }

  private addCircle(circle: SVGCircleElement): void {
    this.svgArea.nativeElement.append(circle);
  }

  private mouseToSvgCoords($event: MouseEvent): SVGPoint {
    const invertedSVGMatrix: SVGMatrix = this.svgArea.nativeElement.getScreenCTM()!.inverse();
    const point: SVGPoint = this.svgArea.nativeElement.createSVGPoint();

    point.x = $event?.clientX;
    point.y = $event?.clientY;

    return point.matrixTransform(invertedSVGMatrix);
  }

  private createCircle(x: string, y: string): SVGCircleElement {
    const circle: SVGCircleElement = document.createElementNS(this.SVG_NAME_SPACE, 'circle');

    circle.setAttribute('r', this.circleDiameter);
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke', 'black');

    circle.onclick = this.circleClickedHandler.bind(this);
    circle.oncontextmenu = this.circleRightClickedHandler.bind(this);

    return circle;
  }

  private removeCircle(circle: SVGCircleElement): void {
    this.svgArea.nativeElement.removeChild(circle);
  }

  private setRadius(circle: SVGCircleElement, radius: string): void {
    circle.setAttribute('r', radius);
  }

  private circleClickedHandler($event: MouseEvent): void {
    $event.stopPropagation();
  }

  private circleRightClickedHandler($event: MouseEvent): void {
    $event.stopPropagation();
    $event.preventDefault();

    this.selectedCircle = {
      circle: $event.target as SVGCircleElement,
      diameter: (+($event.target as SVGCircleElement).getAttribute('r')!) * 2
    };

    this.selectedCircle!.circle.classList.add('selected');
    this.cdRef.detectChanges();
  }

  private subscribeDiameterChanges(): void {
    this.diameterValueChanged$
      .pipe(
        tap((value: number) => this.selectedCircle!.circle.setAttribute('r', value.toString())),
        distinctUntilChanged(),
        debounceTime(300),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        () => {
          this.state.push({
            type: 'adjustDiameter',
            circle: this.selectedCircle!.circle,
            oldDiameter: this.selectedCircle!.diameter,
            newDiameter: (+this.selectedCircle!.circle.getAttribute('r')!) * 2
          });

          this.actualStatePointer = this.state.length;
        }
      );
  }
}
