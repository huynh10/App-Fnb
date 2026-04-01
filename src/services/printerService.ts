import { PrinterConfig } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export class PrinterService {
  /**
   * Sends a print job to the Firebase 'print_jobs' collection.
   * A local Print Agent running on a PC will listen to this collection and execute the print.
   */
  static async printDirect(printer: PrinterConfig, content: string): Promise<boolean> {
    console.log(`Queueing print job for: ${printer.name} (${printer.ipAddress})`);
    
    try {
      if (printer.connectionType === 'lan') {
        const printJobsRef = collection(db, 'print_jobs');
        await addDoc(printJobsRef, {
          printerId: printer.id,
          printerName: printer.name,
          printerIp: printer.ipAddress,
          printerPort: printer.port || 9100,
          content: content,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
        console.log('Print job queued successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Print error:', error);
      throw new Error(`Lỗi máy in: ${error instanceof Error ? error.message : 'Không xác định'}`);
    }
  }
}
