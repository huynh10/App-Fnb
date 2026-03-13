import { PrinterConfig } from '../types';

// Đọc từ .env — trỏ tới IP máy tính chạy Print Agent
// Ví dụ: VITE_PRINT_AGENT_URL=http://192.168.1.10:12345
const AGENT_URL   = import.meta.env.VITE_PRINT_AGENT_URL   || 'http://localhost:12345';
const AGENT_TOKEN = import.meta.env.VITE_PRINT_AGENT_TOKEN || 'fnb-print-2024';

const agentHeaders = {
  'Content-Type': 'application/json',
  'x-agent-token': AGENT_TOKEN,
};

/**
 * PrinterService — kết nối thật với máy in POS qua Print Agent
 *
 * Luồng:  Browser / Điện thoại
 *           → HTTP POST → Print Agent (máy tính quầy: AGENT_URL)
 *           → TCP :9100  → Máy in POS
 */
export class PrinterService {

  /** Kiểm tra Print Agent có đang chạy không */
  static async isAgentRunning(): Promise<boolean> {
    try {
      const res = await fetch(`${AGENT_URL}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** In tới máy in — tự chọn phương thức theo connectionType */
  static async printDirect(printer: PrinterConfig, data: PrintData): Promise<boolean> {
    console.log(`[PrinterService] In tới: ${printer.name} (${printer.connectionType})`);

    if (printer.connectionType === 'lan') {
      return this.printViaAgent(printer, data);
    }
    if (printer.connectionType === 'bluetooth') {
      return this.printBluetooth(printer, data);
    }
    if (printer.connectionType === 'usb') {
      return this.printUSB(printer, data);
    }

    throw new Error(`Loại kết nối không hỗ trợ: ${printer.connectionType}`);
  }

  // ─── LAN: gọi Print Agent ────────────────────────────────────
  private static async printViaAgent(printer: PrinterConfig, data: PrintData): Promise<boolean> {
    const agentOk = await this.isAgentRunning();

    if (!agentOk) {
      throw new Error(
        `Không kết nối được Print Agent tại ${AGENT_URL}\n` +
        'Kiểm tra:\n' +
        '  1. Máy tính quầy đã chạy "node server.js" chưa?\n' +
        '  2. VITE_PRINT_AGENT_URL trong .env có đúng IP không?'
      );
    }

    const res = await fetch(`${AGENT_URL}/print`, {
      method: 'POST',
      headers: agentHeaders,
      body: JSON.stringify({ printer, data }),
    });

    const result = await res.json();
    if (!result.ok) throw new Error(result.error || 'Lỗi không xác định từ Print Agent');
    return true;
  }

  /** Kiểm tra kết nối TCP thật tới máy in (qua Agent) */
  static async testConnection(printer: PrinterConfig): Promise<{ ok: boolean; message: string }> {
    if (printer.connectionType !== 'lan') {
      return { ok: true, message: 'Bluetooth/USB kiểm tra khi in thử' };
    }

    const agentOk = await this.isAgentRunning();
    if (!agentOk) {
      return {
        ok: false,
        message: `Không kết nối Print Agent tại ${AGENT_URL} — kiểm tra node server.js`,
      };
    }

    try {
      const res = await fetch(`${AGENT_URL}/test`, {
        method: 'POST',
        headers: agentHeaders,
        body: JSON.stringify({ ip: printer.ipAddress, port: printer.port || 9100 }),
      });
      return await res.json();
    } catch {
      return { ok: false, message: 'Không liên lạc được với Print Agent' };
    }
  }

  /** Quét mạng LAN tìm máy in (qua Agent) */
  static async scanNetwork(subnet: string = '192.168.1'): Promise<ScannedPrinter[]> {
    const agentOk = await this.isAgentRunning();
    if (!agentOk) {
      throw new Error(
        `Không kết nối Print Agent tại ${AGENT_URL}\n` +
        'Chạy "node server.js" trên máy tính quầy trước.'
      );
    }

    const res = await fetch(`${AGENT_URL}/scan`, {
      method: 'POST',
      headers: agentHeaders,
      body: JSON.stringify({ subnet, port: 9100 }),
    });

    const result = await res.json();
    return result.found || [];
  }

  // ─── Bluetooth: Web Bluetooth API ───────────────────────────
  private static async printBluetooth(printer: PrinterConfig, _data: PrintData): Promise<boolean> {
    if (!(navigator as any).bluetooth) {
      throw new Error('Trình duyệt không hỗ trợ Bluetooth. Dùng Chrome hoặc Edge.');
    }
    // TODO: kết nối GATT, ghi ESC/POS vào characteristic UUID 000018f0
    throw new Error('In Bluetooth chưa được triển khai.');
  }

  // ─── USB: WebUSB API ────────────────────────────────────────
  private static async printUSB(printer: PrinterConfig, _data: PrintData): Promise<boolean> {
    if (!(navigator as any).usb) {
      throw new Error('Trình duyệt không hỗ trợ WebUSB. Dùng Chrome hoặc Edge.');
    }
    // TODO: WebUSB requestDevice, claimInterface, transferOut ESC/POS
    throw new Error('In USB chưa được triển khai.');
  }
}

// ─── Types ──────────────────────────────────────────────────────
export interface PrintData {
  type: 'bill' | 'kitchen';
  storeName?: string;
  address?: string;
  phone?: string;
  tableName: string;
  staffName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    note?: string;
  }>;
  total?: number;
  subtotal?: number;
  discount?: number;
  vat?: number;
}

export interface ScannedPrinter {
  ip: string;
  port: number;
  name: string;
}
