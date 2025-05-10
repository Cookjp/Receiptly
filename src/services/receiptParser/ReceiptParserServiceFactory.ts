import { ReceiptParserService } from "./ReceiptParserService";
import { TextReceiptParserService } from "./TextReceiptParserService";

export class ReceiptParserFactory {
    static getReceiptParserService(): ReceiptParserService {
      return new TextReceiptParserService();
    }
  }