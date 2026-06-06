import { Component, inject } from '@angular/core';
import { Setup } from './components/setup/setup';
import { Simulation } from './components/simulation/simulation';
import { RumbleService } from './services/rumble.service';

@Component({
  selector: 'app-root',
  imports: [Setup, Simulation],
  template: `
    @if (rumble.state() === null) {
      <app-setup />
    } @else {
      <app-simulation />
    }
  `,
  styleUrl: './app.scss',
})
export class App {
  protected readonly rumble = inject(RumbleService);
}
