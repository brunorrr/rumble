import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RumbleService } from '../../services/rumble.service';

@Component({
  selector: 'app-setup',
  imports: [FormsModule],
  template: `
    <div class="setup">
      <div class="setup-card">
        <div class="setup-title">
          <span class="icon">🥊</span>
          <h1>ROYAL RUMBLE</h1>
          <p class="subtitle">Last one standing wins</p>
        </div>

        <div class="setup-form">
          <label>Number of contestants</label>
          <div class="input-group">
            <button type="button" (click)="decrement()" [disabled]="count <= 4">−</button>
            <input type="number" [(ngModel)]="count" [min]="4" [max]="30" (change)="clamp()" />
            <button type="button" (click)="increment()" [disabled]="count >= 30">+</button>
          </div>
          <p class="hint">Min 4 · Max 30</p>
        </div>

        <button class="btn-start" type="button" (click)="start()">
          START THE RUMBLE
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .setup {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0f;
      background-image:
        radial-gradient(circle at 20% 50%, rgba(220, 20, 60, 0.12) 0%, transparent 55%),
        radial-gradient(circle at 80% 50%, rgba(255, 215, 0, 0.08) 0%, transparent 55%);
    }

    .setup-card {
      background: #13131d;
      border: 1px solid #1e2a40;
      border-radius: 24px;
      padding: 56px 64px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 36px;
      min-width: 380px;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
    }

    .setup-title {
      text-align: center;

      .icon {
        font-size: 3.5rem;
        display: block;
        margin-bottom: 14px;
        filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.4));
      }

      h1 {
        font-size: 2.2rem;
        font-weight: 900;
        letter-spacing: 7px;
        background: linear-gradient(135deg, #ffd700, #ff8c00);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
      }

      .subtitle {
        color: #475569;
        font-size: 0.8rem;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin: 10px 0 0;
      }
    }

    .setup-form {
      width: 100%;
      text-align: center;

      label {
        display: block;
        color: #64748b;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 14px;
      }
    }

    .input-group {
      display: flex;
      align-items: center;
      justify-content: center;

      button {
        width: 44px;
        height: 52px;
        background: #1e293b;
        border: 1px solid #334155;
        color: #e2e8f0;
        font-size: 1.3rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
        line-height: 1;

        &:first-child { border-radius: 10px 0 0 10px; }
        &:last-child  { border-radius: 0 10px 10px 0; }

        &:hover:not(:disabled) { background: #334155; }
        &:disabled { opacity: 0.3; cursor: not-allowed; }
      }

      input {
        width: 90px;
        height: 52px;
        background: #1a1a2e;
        border: 1px solid #334155;
        border-left: none;
        border-right: none;
        color: #ffd700;
        font-size: 1.7rem;
        font-weight: 800;
        text-align: center;
        -moz-appearance: textfield;
        font-family: 'Courier New', monospace;
        outline: none;

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button { -webkit-appearance: none; }
      }
    }

    .hint {
      color: #334155;
      font-size: 0.72rem;
      margin: 8px 0 0;
      letter-spacing: 1px;
    }

    .btn-start {
      background: linear-gradient(135deg, #dc143c, #ff4500);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 17px 0;
      font-size: 1rem;
      font-weight: 800;
      letter-spacing: 4px;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      box-shadow: 0 4px 24px rgba(220, 20, 60, 0.35);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(220, 20, 60, 0.5);
      }

      &:active { transform: translateY(0); }
    }
  `],
})
export class Setup {
  private rumble = inject(RumbleService);
  count = 10;

  increment(): void { if (this.count < 30) this.count++; }
  decrement(): void { if (this.count > 4) this.count--; }
  clamp(): void { this.count = Math.max(4, Math.min(30, this.count || 10)); }
  start(): void { this.rumble.init(this.count); }
}
