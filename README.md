# Ng7Guis

## !! IMPORTANT NOTE !!

Please, don't rate my skills too much basing on the implementation here. Everything here was done because of boredom working in yellow russian bank in 2023. After some gap finished in 2025. Because of this old Angular 16.2 is used without all fabolous features like flow control, standalone components and etc. I prefer bootstrap, so I used it for styles. 

Based on https://7guis.bradwoods.io/. Algorithms are mine, but layout I stole from their examples. 

I event didn't apply any linter (despite the fact I have my own rules). Tests are not done of course.

## Setup

I have here angular workspace with 7 applications (projects). First you need to run:

`npm i`

Then you can run example you need.

`npm run start:counter`

`npm run start:temperature-converter`

`npm run start:flight-booker`

`npm run start:timer`

`npm run start:crud`

`npm run start:circle-drawer`

`npm run start:cells`

### Counter

Just simply counter with ngModel.

### Temperature converter

Old ngModel app as counter.

### Flight booker

Reactive form (best thing in angular ever) app with validations.

### Timer

Simple timer, really cool app. Example of RxJS usage with multiple streams. 

### Crud
Average crud application. I didn't implement here proper state because I was too lazy. Usually I used redux or self-implemented proper service in Angular apps.

### Circle drawer
Graphic is an Achilles heel of every frontend developer. Actually this could be done better with @Directives in Angular.

### Cell
Mini-excel table. One thing is not handled there - cells cyclic dependency. In example it is handled by try-catch with call-stack overflow. I don't like this way, but proper algorithm will take time.
