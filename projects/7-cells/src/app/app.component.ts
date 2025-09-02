import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormArray } from '@angular/forms';

import { ReplaySubject } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';

interface ICell {
  value?: string | null;
  formula?: string | null;
  children: Array<string>;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {

  readonly expressionSymbol: string = '=';
  readonly errorMessage: string = 'error';

  columnsLetters: Array<string> = this.generateAlphabet();
  rowsNumbers: Array<number> = this.generateRowsArray();

  spreadsheetForm: FormGroup;

  private cells: { [coordinates: string]: ICell } = {};

  private readonly unsubscribe$: ReplaySubject<void> = new ReplaySubject<void>(1);

  constructor(private formBuilder: FormBuilder) {
  }

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  changeCellViewMode(column: string, row: number): void {
    const activeCell: ICell | undefined = this.cells[`${column}${row}`];

    if (activeCell?.value !== null && activeCell?.value !== undefined) {
      const currentCellFormValue: string = this.getCellFormValue(column, row);

      if (currentCellFormValue === activeCell.value) {
        this.updateCellForm(activeCell.formula || activeCell.value, column, row);
      } else if (currentCellFormValue === activeCell.formula) {
        this.updateCellForm(activeCell.value, column, row);
      }
    }
  }

  private actualizeCellRelatives(column: string, row: number, oldParentsCells: Array<string> | null = null, newParentCells: Array<string> | null = null): void {
    this.cleanOldCellParents(column, row, oldParentsCells);
    this.setNewCellParents(column, row, newParentCells);
    this.recalculateChildren(column, row);
  }

  recalculateChildren(column: string, row: number): void {
    const activeCell: ICell = this.cells[`${column}${row}`];

    activeCell.children.forEach((childCoordinates: string) => {
      this.parseValue(this.cells[childCoordinates].formula!, childCoordinates[0], +childCoordinates.slice(1))
    });
  }

  cleanOldCellParents(column: string, row: number, oldParentsCells: Array<string> | null = null): void {
    oldParentsCells?.forEach((parentCoordinates: string) => {
      if (this.cells[parentCoordinates]) {
        this.cells[parentCoordinates].children = this.cells[parentCoordinates].children.filter((childCoordinates: string) => childCoordinates !== `${column}${row}`);
      } else {
        this.cells[parentCoordinates] = {
          children: []
        };
      }
    });
  }

  setNewCellParents(column: string, row: number, newParentCells: Array<string> | null = null): void {
    newParentCells?.forEach((newParentCoordinates: string) => {
      if (this.cells[newParentCoordinates]) {
        this.cells[newParentCoordinates].children.push(`${column}${row}`);
      } else {
        this.cells[newParentCoordinates] = {
          children: [`${column}${row}`]
        };
      }
    });
  }

  private parseValue(value: string, column: string, row: number): void {
    let activeCell: ICell | undefined = this.cells[`${column}${row}`];

    if (!activeCell) {
      this.cells[`${column}${row}`] = {
        children: []
      };
      activeCell = this.cells[`${column}${row}`];
    }

    if (value === '') {
      const oldParentsCells: Array<string> = this.extractParentCells(activeCell.formula || '');
      activeCell.value = null;
      activeCell.formula = '';
      this.actualizeCellRelatives(column, row, oldParentsCells);
      this.updateCellForm(value, column, row);
    } else if (isNaN(+value)) {
      const cleanedNewFormula: string = this.prepareCellFormula(value);
      const calculatedValue: string = this.calculateCellValue(this.replaceCellsWithValues(cleanedNewFormula));
      const newParentsCells: Array<string> = this.extractParentCells(cleanedNewFormula);
      const oldParentsCells: Array<string> = this.extractParentCells(activeCell.formula || '');
      activeCell.formula = value;
      activeCell.value = calculatedValue;
      this.actualizeCellRelatives(column, row, oldParentsCells, newParentsCells);
      this.updateCellForm(calculatedValue, column, row);
    } else {
      const oldParentsCells: Array<string> = this.extractParentCells(activeCell.formula || '');
      activeCell.value = value;
      activeCell.formula = '';
      this.actualizeCellRelatives(column, row, oldParentsCells);
      this.updateCellForm(value, column, row);
    }
  }

  private calculateCellValue(finalizedFormula: string): string {
    let calculatedValue: string;

    try {
      calculatedValue = eval(finalizedFormula);

      if (isNaN(+calculatedValue)) {
        throw Error();
      }
    } catch {
      calculatedValue = this.errorMessage;
    }

    return calculatedValue;
  }

  private prepareCellFormula(formula: string): string {
    if (!formula.startsWith('=')) {
      return this.errorMessage;
    }

    return formula.slice(1).replace(/ /g,'').toUpperCase();
  }

  private replaceCellsWithValues(formula: string): string {
    const parentCells: Array<string> = this.extractParentCells(formula) || [];

    parentCells.forEach((cellCoordinates: string) => {
      const parentCellValue: string = (this.cells[cellCoordinates]?.value ?? this.getCellFormValue(cellCoordinates[0], +cellCoordinates.slice(1))) || '0';
      formula = formula.replace(cellCoordinates, parentCellValue);
    });

    return formula;
  }

  private extractParentCells(formula: string): Array<string> {
    const cellMentionPattern: RegExp = new RegExp(/[A-Z](?:0|[1-9][0-9]?|100)/gi);
    const parentCells: Array<string> | null = formula.match(cellMentionPattern);

    return parentCells || [];
  }

  private buildForm(): void {
    this.spreadsheetForm = this.formBuilder.group({});
    this.columnsLetters.forEach((columnLetter: string) => {
      const columnLetterFormArray: FormArray = this.formBuilder.array([
        ...this.rowsNumbers.map((rowNumber: number) => {
          const cellFormControl: FormControl = this.formBuilder.control('', { updateOn: 'blur' });

          cellFormControl
            .valueChanges
            .pipe(
              distinctUntilChanged(),
              debounceTime(200),
              takeUntil(this.unsubscribe$)
            )
            .subscribe(
              (value: string) => this.parseValue(value, columnLetter, rowNumber)
            );

          return cellFormControl;
        })
      ]);

      this.spreadsheetForm.addControl(columnLetter, columnLetterFormArray);
    });
  }

  private getCellFormValue(column: string, row: number): string {
    return (this.spreadsheetForm.get(column) as FormArray).at(row).value;
  }

  private updateCellForm(value: string, column: string, row: number): void {
    (this.spreadsheetForm.get(column) as FormArray).at(row).setValue(value, { emitEvent: false });
  }

  private generateAlphabet(): Array<string> {
    const alphabet: Array<string> = [];

    for (let i = 65; i <= 90; i++) {
      alphabet.push(String.fromCharCode(i));
    }

    return alphabet;
  }

  private generateRowsArray(): Array<number> {
    const start = 0;
    const end = 99;

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
